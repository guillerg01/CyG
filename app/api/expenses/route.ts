import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBalanceField } from "@/features/expenses/utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  const categoryId = searchParams.get("categoryId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const expenseType = searchParams.get("expenseType");
  const paymentMethod = searchParams.get("paymentMethod");
  const limit = searchParams.get("limit");

  const where: Record<string, unknown> = { userId: session.id };

  if (accountId) {
    where.accountId = accountId;
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (expenseType) {
    where.expenseType = expenseType;
  }
  if (paymentMethod) {
    where.paymentMethod = paymentMethod;
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

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      category: true,
      account: true,
    },
    orderBy: { createdAt: "desc" },
    ...(limit && { take: parseInt(limit) }),
  });

  return NextResponse.json(expenses);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    amount,
    description,
    currency,
    paymentMethod,
    expenseType,
    isShared,
    plannedDate,
    accountId,
    categoryId,
    createdAt,
  } = body;

  if (!amount || !currency || !paymentMethod || !accountId || !categoryId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      amount,
      description,
      currency,
      paymentMethod,
      expenseType: expenseType || "REALIZED",
      isShared: isShared || false,
      plannedDate: plannedDate ? new Date(plannedDate) : null,
      userId: session.id,
      accountId,
      categoryId,
      ...(createdAt && { createdAt: new Date(createdAt) }),
    },
    include: {
      category: true,
      account: true,
    },
  });

  if (expenseType !== "PLANNED") {
    const field = getBalanceField(currency);
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { users: { include: { user: true } } },
    });

    // Si es un gasto compartido, distribuir proporcionalmente según ingresos configurados en perfil
    if (isShared && account?.isShared && account.users.length > 0) {
      // Obtener ingresos configurados de cada usuario según la moneda del gasto
      const userIncomes: Record<string, number> = {};
      let totalIncomes = 0;

      for (const userAccount of account.users) {
        let userIncome = 0;
        
        // Obtener el ingreso configurado según la moneda del gasto
        if (currency === "USD_ZELLE" || currency === "USD_EFECTIVO") {
          userIncome = userAccount.user.monthlyIncomeUSD || 0;
        } else if (currency === "USDT") {
          userIncome = userAccount.user.monthlyIncomeUSDT || 0;
        } else if (currency === "CUP_EFECTIVO" || currency === "CUP_TRANSFERENCIA") {
          userIncome = userAccount.user.monthlyIncomeCUP || 0;
        }

        userIncomes[userAccount.userId] = userIncome;
        totalIncomes += userIncome;
      }

      // Si no hay ingresos configurados, usar incomePercentage como fallback
      const usePercentageFallback = totalIncomes === 0;

      // Distribuir el gasto proporcionalmente entre todos los usuarios
      for (const userAccount of account.users) {
        let userShare: number;
        let percentage: number;

        if (usePercentageFallback) {
          // Fallback: usar incomePercentage si no hay ingresos configurados
          const totalPercentage = account.users.reduce(
            (sum, ua) => sum + ua.user.incomePercentage,
            0
          );
          percentage = (userAccount.user.incomePercentage / totalPercentage) * 100;
          userShare = (amount * userAccount.user.incomePercentage) / totalPercentage;
        } else {
          // Calcular proporción basada en ingresos configurados en perfil
          const userIncome = userIncomes[userAccount.userId] || 0;
          percentage = totalIncomes > 0 ? (userIncome / totalIncomes) * 100 : 0;
          userShare = totalIncomes > 0 ? (amount * userIncome) / totalIncomes : 0;
        }

        // Buscar la cuenta personal del usuario o usar el banco principal
        const personalAccount = await prisma.account.findFirst({
          where: {
            isShared: false,
            users: {
              some: {
                userId: userAccount.userId,
                role: "owner",
              },
            },
          },
        });

        // Usar cuenta personal si existe, sino usar el banco principal
        const targetAccount = personalAccount || account;

        // Deducir su parte proporcional
        await prisma.account.update({
          where: { id: targetAccount.id },
          data: { [field]: { decrement: userShare } },
        });

        // Crear transacción para el usuario
        await prisma.transaction.create({
          data: {
            type: "EXPENSE",
            amount: userShare,
            currency,
            description: `${description || "Gasto compartido"} (${percentage.toFixed(1)}%)`,
            referenceId: expense.id,
            userId: userAccount.userId,
            accountId: targetAccount.id,
          },
        });
      }
    } else {
      // Gasto no compartido: deducir directamente de la cuenta
      await prisma.account.update({
        where: { id: accountId },
        data: { [field]: { decrement: amount } },
      });

      await prisma.transaction.create({
        data: {
          type: "EXPENSE",
          amount,
          currency,
          description,
          referenceId: expense.id,
          userId: session.id,
          accountId,
        },
      });
    }
  }

  await prisma.change.create({
    data: {
      action: "CREATE",
      entityType: "EXPENSE",
      entityId: expense.id,
      newValue: JSON.stringify(expense),
      authorId: session.id,
      expenseId: expense.id,
    },
  });

  return NextResponse.json(expense);
}

