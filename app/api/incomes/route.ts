import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBalanceField } from "@/features/incomes/utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = searchParams.get("limit");

  const where: Record<string, unknown> = { userId: session.id };

  if (accountId) {
    where.accountId = accountId;
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
    }
    if (endDate) {
      (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
    }
  }

  const incomes = await prisma.income.findMany({
    where,
    include: {
      account: true,
    },
    orderBy: { createdAt: "desc" },
    ...(limit && { take: parseInt(limit) }),
  });

  return NextResponse.json(incomes);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { amount, description, currency, accountId, createdAt, exchangeRate, convertToCUP } = body;

  if (!amount || !currency || !accountId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const targetAccount = await prisma.account.findUnique({
    where: { id: accountId },
    include: { users: { include: { user: true } } },
  });

  if (!targetAccount) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Si es un ingreso de USD a la cuenta compartida de la casa y se debe convertir a CUP
  if (convertToCUP && targetAccount.isShared && (currency === "USD_ZELLE" || currency === "USD_EFECTIVO") && exchangeRate) {
    // Calcular proporción según ingresos configurados
    const userIncomes: Record<string, number> = {};
    let totalIncomes = 0;

    for (const userAccount of targetAccount.users) {
      const userIncome = userAccount.user.monthlyIncomeUSD || 0;
      userIncomes[userAccount.userId] = userIncome;
      totalIncomes += userIncome;
    }

    const usePercentageFallback = totalIncomes === 0;
    const totalPercentage = targetAccount.users.reduce(
      (sum, ua) => sum + ua.user.incomePercentage,
      0
    );

    // Restar proporcionalmente del banco principal
    const bancoPrincipal = await prisma.account.findFirst({
      where: {
        name: "Banco Principal USD Zelle",
        isShared: true,
      },
    });

    if (!bancoPrincipal) {
      return NextResponse.json({ error: "Banco principal not found" }, { status: 404 });
    }

    const usdField = getBalanceField(currency);
    const cupAmount = amount * exchangeRate;

    // Restar proporcionalmente del banco principal y convertir a CUP en la cuenta compartida
    for (const userAccount of targetAccount.users) {
      let userShare: number;
      if (usePercentageFallback) {
        userShare = (amount * userAccount.user.incomePercentage) / totalPercentage;
      } else {
        const userIncome = userIncomes[userAccount.userId] || 0;
        userShare = totalIncomes > 0 ? (amount * userIncome) / totalIncomes : 0;
      }

      // Restar del banco principal
      await prisma.account.update({
        where: { id: bancoPrincipal.id },
        data: { [usdField]: { decrement: userShare } },
      });
    }

    // Agregar CUP a la cuenta compartida
    await prisma.account.update({
      where: { id: accountId },
      data: { balanceCUPEfectivo: { increment: cupAmount } },
    });

    // Buscar y devolver préstamos pendientes de CUP de cuentas personales a la cuenta compartida
    const pendingLoans = await prisma.loan.findMany({
      where: {
        toAccountId: accountId,
        currency: "CUP_EFECTIVO",
        isPaid: false,
      },
      include: {
        fromAccount: {
          include: {
            users: true,
          },
        },
      },
    });

    let remainingCUP = cupAmount;
    for (const loan of pendingLoans) {
      if (remainingCUP <= 0) break;

      const remainingLoan = loan.amount - loan.paidAmount;
      const repaymentAmount = Math.min(remainingLoan, remainingCUP);

      // Actualizar el préstamo
      const newPaidAmount = loan.paidAmount + repaymentAmount;
      const isPaid = newPaidAmount >= loan.amount;

      await prisma.loan.update({
        where: { id: loan.id },
        data: {
          paidAmount: newPaidAmount,
          isPaid,
          ...(isPaid && { paidDate: new Date() }),
        },
      });

      // Devolver a la cuenta personal
      await prisma.account.update({
        where: { id: loan.fromAccountId },
        data: { balanceCUPEfectivo: { increment: repaymentAmount } },
      });

      // Restar de la cuenta compartida
      await prisma.account.update({
        where: { id: accountId },
        data: { balanceCUPEfectivo: { decrement: repaymentAmount } },
      });

      remainingCUP -= repaymentAmount;

      // Crear transacción de pago de préstamo
      await prisma.transaction.create({
        data: {
          type: "LOAN_PAYMENT",
          amount: repaymentAmount,
          currency: "CUP_EFECTIVO",
          description: `Devolución automática de préstamo a ${loan.fromAccount.name}`,
          referenceId: loan.id,
          userId: session.id,
          accountId: loan.fromAccountId,
        },
      });
    }

    // Crear el ingreso con la conversión
    const income = await prisma.income.create({
      data: {
        amount: cupAmount,
        description: `${description || "Ingreso"} (convertido de ${amount} ${currency} a ${cupAmount.toFixed(2)} CUP)`,
        currency: "CUP_EFECTIVO",
        userId: session.id,
        accountId,
        ...(createdAt && { createdAt: new Date(createdAt) }),
      },
      include: {
        account: true,
      },
    });

    // Crear registro de conversión
    await prisma.conversion.create({
      data: {
        fromAmount: amount,
        toAmount: cupAmount,
        fromCurrency: currency,
        toCurrency: "CUP_EFECTIVO",
        exchangeRate,
        userId: session.id,
        accountId,
      },
    });

    await prisma.transaction.create({
      data: {
        type: "INCOME",
        amount: cupAmount,
        currency: "CUP_EFECTIVO",
        description: income.description,
        referenceId: income.id,
        userId: session.id,
        accountId,
      },
    });

    await prisma.change.create({
      data: {
        action: "CREATE",
        entityType: "INCOME",
        entityId: income.id,
        newValue: JSON.stringify(income),
        authorId: session.id,
        incomeId: income.id,
      },
    });

    return NextResponse.json(income);
  }

  // Lógica normal de ingreso
  const income = await prisma.income.create({
    data: {
      amount,
      description,
      currency,
      userId: session.id,
      accountId,
      ...(createdAt && { createdAt: new Date(createdAt) }),
    },
    include: {
      account: true,
    },
  });

  const field = getBalanceField(currency);
  await prisma.account.update({
    where: { id: accountId },
    data: { [field]: { increment: amount } },
  });

  await prisma.transaction.create({
    data: {
      type: "INCOME",
      amount,
      currency,
      description,
      referenceId: income.id,
      userId: session.id,
      accountId,
    },
  });

  await prisma.change.create({
    data: {
      action: "CREATE",
      entityType: "INCOME",
      entityId: income.id,
      newValue: JSON.stringify(income),
      authorId: session.id,
      incomeId: income.id,
    },
  });

  return NextResponse.json(income);
}

