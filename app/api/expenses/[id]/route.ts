import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBalanceField } from "@/features/expenses/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const expense = await prisma.expense.findFirst({
    where: { id, userId: session.id },
    include: {
      category: true,
      account: true,
    },
  });

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  return NextResponse.json(expense);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.expense.findFirst({
    where: { id, userId: session.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const {
    amount,
    description,
    currency,
    paymentMethod,
    expenseType,
    isShared,
    plannedDate,
    categoryId,
    createdAt,
  } = body;

  if (existing.expenseType !== "PLANNED" && amount !== undefined) {
    const oldField = getBalanceField(existing.currency);
    const account = await prisma.account.findUnique({
      where: { id: existing.accountId },
      include: { users: { include: { user: true } } },
    });

    // Si era un gasto compartido, revertir las deducciones proporcionales
    if (existing.isShared && account?.isShared && account.users.length > 0) {
      // Obtener ingresos configurados de cada usuario según la moneda del gasto
      const userIncomes: Record<string, number> = {};
      let totalIncomes = 0;

      for (const userAccount of account.users) {
        let userIncome = 0;
        
        if (existing.currency === "USD_ZELLE" || existing.currency === "USD_EFECTIVO") {
          userIncome = userAccount.user.monthlyIncomeUSD || 0;
        } else if (existing.currency === "USDT") {
          userIncome = userAccount.user.monthlyIncomeUSDT || 0;
        } else if (existing.currency === "CUP_EFECTIVO" || existing.currency === "CUP_TRANSFERENCIA") {
          userIncome = userAccount.user.monthlyIncomeCUP || 0;
        }

        userIncomes[userAccount.userId] = userIncome;
        totalIncomes += userIncome;
      }

      const usePercentageFallback = totalIncomes === 0;
      const totalPercentage = account.users.reduce(
        (sum, ua) => sum + ua.user.incomePercentage,
        0
      );

      for (const userAccount of account.users) {
        let userShare: number;
        if (usePercentageFallback) {
          userShare = (existing.amount * userAccount.user.incomePercentage) / totalPercentage;
        } else {
          const userIncome = userIncomes[userAccount.userId] || 0;
          userShare = totalIncomes > 0 ? (existing.amount * userIncome) / totalIncomes : 0;
        }

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
        const targetAccount = personalAccount || account;

        await prisma.account.update({
          where: { id: targetAccount.id },
          data: { [oldField]: { increment: userShare } },
        });
      }
    } else {
      // Revertir deducción de cuenta no compartida
      await prisma.account.update({
        where: { id: existing.accountId },
        data: { [oldField]: { increment: existing.amount } },
      });
    }

    // Aplicar nueva deducción (compartida o no)
    const newCurrency = currency || existing.currency;
    const newField = getBalanceField(newCurrency);
    const newIsShared = isShared !== undefined ? isShared : existing.isShared;
    const newAccount = await prisma.account.findUnique({
      where: { id: existing.accountId },
      include: { users: { include: { user: true } } },
    });

    if (newIsShared && newAccount?.isShared && newAccount.users.length > 0) {
      // Obtener ingresos configurados de cada usuario según la moneda del gasto
      const userIncomes: Record<string, number> = {};
      let totalIncomes = 0;

      for (const userAccount of newAccount.users) {
        let userIncome = 0;
        
        if (newCurrency === "USD_ZELLE" || newCurrency === "USD_EFECTIVO") {
          userIncome = userAccount.user.monthlyIncomeUSD || 0;
        } else if (newCurrency === "USDT") {
          userIncome = userAccount.user.monthlyIncomeUSDT || 0;
        } else if (newCurrency === "CUP_EFECTIVO" || newCurrency === "CUP_TRANSFERENCIA") {
          userIncome = userAccount.user.monthlyIncomeCUP || 0;
        }

        userIncomes[userAccount.userId] = userIncome;
        totalIncomes += userIncome;
      }

      const usePercentageFallback = totalIncomes === 0;
      const totalPercentage = newAccount.users.reduce(
        (sum, ua) => sum + ua.user.incomePercentage,
        0
      );

      for (const userAccount of newAccount.users) {
        let userShare: number;
        let percentage: number;

        if (usePercentageFallback) {
          percentage = (userAccount.user.incomePercentage / totalPercentage) * 100;
          userShare = (amount * userAccount.user.incomePercentage) / totalPercentage;
        } else {
          const userIncome = userIncomes[userAccount.userId] || 0;
          percentage = totalIncomes > 0 ? (userIncome / totalIncomes) * 100 : 0;
          userShare = totalIncomes > 0 ? (amount * userIncome) / totalIncomes : 0;
        }

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
        const targetAccount = personalAccount || newAccount;

        await prisma.account.update({
          where: { id: targetAccount.id },
          data: { [newField]: { decrement: userShare } },
        });
      }
    } else {
      await prisma.account.update({
        where: { id: existing.accountId },
        data: { [newField]: { decrement: amount } },
      });
    }
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...(amount !== undefined && { amount }),
      ...(description !== undefined && { description }),
      ...(currency && { currency }),
      ...(paymentMethod && { paymentMethod }),
      ...(expenseType && { expenseType }),
      ...(isShared !== undefined && { isShared }),
      ...(plannedDate !== undefined && { plannedDate: plannedDate ? new Date(plannedDate) : null }),
      ...(categoryId && { categoryId }),
      ...(createdAt && { createdAt: new Date(createdAt) }),
    },
    include: {
      category: true,
      account: true,
    },
  });

  await prisma.change.create({
    data: {
      action: "UPDATE",
      entityType: "EXPENSE",
      entityId: expense.id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(expense),
      authorId: session.id,
      expenseId: expense.id,
    },
  });

  return NextResponse.json(expense);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.expense.findFirst({
    where: { id, userId: session.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  if (existing.expenseType !== "PLANNED") {
    const field = getBalanceField(existing.currency);
    await prisma.account.update({
      where: { id: existing.accountId },
      data: { [field]: { increment: existing.amount } },
    });
  }

  await prisma.expense.delete({ where: { id } });

  await prisma.change.create({
    data: {
      action: "DELETE",
      entityType: "EXPENSE",
      entityId: id,
      oldValue: JSON.stringify(existing),
      authorId: session.id,
    },
  });

  return NextResponse.json({ success: true });
}

