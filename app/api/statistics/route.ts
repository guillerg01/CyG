import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const userId = searchParams.get("userId");

  const dateFilter: Record<string, unknown> = {};
  if (startDate) {
    dateFilter.gte = new Date(startDate);
  }
  if (endDate) {
    dateFilter.lte = new Date(endDate);
  }

  const userFilter = userId || session.id;

  const expenses = await prisma.expense.findMany({
    where: {
      userId: userFilter,
      expenseType: "REALIZED",
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    },
    include: { category: true },
  });

  const incomes = await prisma.income.findMany({
    where: {
      userId: userFilter,
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    },
  });

  const totalExpensesUSD = expenses
    .filter((e) => e.currency === "USD_ZELLE" || e.currency === "USD_EFECTIVO")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpensesUSDT = expenses
    .filter((e) => e.currency === "USDT")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpensesCUP = expenses
    .filter((e) => e.currency === "CUP_EFECTIVO" || e.currency === "CUP_TRANSFERENCIA")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalIncomesUSD = incomes
    .filter((i) => i.currency === "USD_ZELLE" || i.currency === "USD_EFECTIVO")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalIncomesUSDT = incomes
    .filter((i) => i.currency === "USDT")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalIncomesCUP = incomes
    .filter((i) => i.currency === "CUP_EFECTIVO" || i.currency === "CUP_TRANSFERENCIA")
    .reduce((sum, i) => sum + i.amount, 0);

  const expensesByCash = expenses
    .filter((e) => e.paymentMethod === "CASH")
    .reduce((sum, e) => sum + e.amount, 0);
  const expensesByTransfer = expenses
    .filter((e) => e.paymentMethod === "TRANSFER")
    .reduce((sum, e) => sum + e.amount, 0);

  const expensesByCategory = expenses.reduce(
    (acc, e) => {
      const key = e.category.name;
      if (!acc[key]) {
        acc[key] = { USD: 0, USDT: 0, CUP: 0 };
      }
      if (e.currency === "USD_ZELLE" || e.currency === "USD_EFECTIVO") {
        acc[key].USD += e.amount;
      } else if (e.currency === "USDT") {
        acc[key].USDT += e.amount;
      } else if (e.currency === "CUP_EFECTIVO" || e.currency === "CUP_TRANSFERENCIA") {
        acc[key].CUP += e.amount;
      }
      return acc;
    },
    {} as Record<string, { USD: number; USDT: number; CUP: number }>
  );

  const monthlyExpenses = expenses.reduce(
    (acc, e) => {
      const date = new Date(e.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[key]) {
        acc[key] = { USD: 0, USDT: 0, CUP: 0 };
      }
      if (e.currency === "USD_ZELLE" || e.currency === "USD_EFECTIVO") {
        acc[key].USD += e.amount;
      } else if (e.currency === "USDT") {
        acc[key].USDT += e.amount;
      } else if (e.currency === "CUP_EFECTIVO" || e.currency === "CUP_TRANSFERENCIA") {
        acc[key].CUP += e.amount;
      }
      return acc;
    },
    {} as Record<string, { USD: number; USDT: number; CUP: number }>
  );

  const monthlyIncomes = incomes.reduce(
    (acc, i) => {
      const date = new Date(i.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[key]) {
        acc[key] = { USD: 0, USDT: 0, CUP: 0 };
      }
      if (i.currency === "USD_ZELLE" || i.currency === "USD_EFECTIVO") {
        acc[key].USD += i.amount;
      } else if (i.currency === "USDT") {
        acc[key].USDT += i.amount;
      } else if (i.currency === "CUP_EFECTIVO" || i.currency === "CUP_TRANSFERENCIA") {
        acc[key].CUP += i.amount;
      }
      return acc;
    },
    {} as Record<string, { USD: number; USDT: number; CUP: number }>
  );

  return NextResponse.json({
    totals: {
      expenses: { USD: totalExpensesUSD, USDT: totalExpensesUSDT, CUP: totalExpensesCUP },
      incomes: { USD: totalIncomesUSD, USDT: totalIncomesUSDT, CUP: totalIncomesCUP },
      balance: {
        USD: totalIncomesUSD - totalExpensesUSD,
        USDT: totalIncomesUSDT - totalExpensesUSDT,
        CUP: totalIncomesCUP - totalExpensesCUP,
      },
    },
    byPaymentMethod: {
      cash: expensesByCash,
      transfer: expensesByTransfer,
    },
    byCategory: expensesByCategory,
    monthly: {
      expenses: monthlyExpenses,
      incomes: monthlyIncomes,
    },
  });
}

