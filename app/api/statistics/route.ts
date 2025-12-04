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

  const userAccounts = await prisma.account.findMany({
    where: {
      users: {
        some: {
          userId: userFilter,
        },
      },
    },
    select: {
      id: true,
      isShared: true,
      balanceUSDZelle: true,
      balanceUSDEfectivo: true,
      balanceUSDT: true,
      balanceCUPEfectivo: true,
      balanceCUPTransferencia: true,
    },
  });

  const userAccountIds = userAccounts.map((a) => a.id);

  const sharedAccountIds = userAccounts
    .filter((a) => {
      const account = userAccounts.find((acc) => acc.id === a.id);
      return account;
    })
    .map((a) => a.id);

  const expenses = await prisma.expense.findMany({
    where: {
      OR: [
        { userId: userFilter },
        {
          isShared: true,
          accountId: { in: userAccountIds },
        },
      ],
      expenseType: "REALIZED",
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    },
    include: {
      category: true,
      account: {
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  monthlyIncomeUSD: true,
                  monthlyIncomeUSDT: true,
                  monthlyIncomeCUP: true,
                  incomePercentage: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const plannedExpenses = await prisma.expense.findMany({
    where: {
      OR: [
        { userId: userFilter },
        {
          isShared: true,
          accountId: { in: userAccountIds },
        },
      ],
      expenseType: "PLANNED",
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    },
    include: { category: true },
  });

  const incomes = await prisma.income.findMany({
    where: {
      userId: userFilter,
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    },
    include: {
      account: true,
    },
  });

  const sharedHouseIncomes = await prisma.income.findMany({
    where: {
      account: {
        isShared: true,
        name: {
          contains: "Casa",
          mode: "insensitive",
        },
        users: {
          some: {
            userId: userFilter,
          },
        },
      },
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    },
    include: {
      account: true,
    },
  });

  const conversions = await prisma.conversion.findMany({
    where: {
      OR: [{ userId: userFilter }, { accountId: { in: userAccountIds } }],
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    },
    include: {
      account: {
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  monthlyIncomeUSD: true,
                  monthlyIncomeUSDT: true,
                  monthlyIncomeCUP: true,
                  incomePercentage: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const currentUser = await prisma.user.findUnique({
    where: { id: userFilter },
    select: {
      monthlyIncomeUSD: true,
      monthlyIncomeUSDT: true,
      monthlyIncomeCUP: true,
      incomePercentage: true,
    },
  });

  const totalExpensesUSD = expenses
    .filter((e) => e.currency === "USD_ZELLE" || e.currency === "USD_EFECTIVO")
    .reduce((sum, e) => {
      if (e.isShared && e.account.isShared && e.account.users.length > 0) {
        const userIncomes: Record<string, number> = {};
        let totalIncomes = 0;

        for (const userAccount of e.account.users) {
          const userIncome = userAccount.user.monthlyIncomeUSD || 0;
          userIncomes[userAccount.userId] = userIncome;
          totalIncomes += userIncome;
        }

        const usePercentageFallback = totalIncomes === 0;
        let userShare: number;

        if (usePercentageFallback) {
          const totalPercentage = e.account.users.reduce(
            (acc, ua) => acc + ua.user.incomePercentage,
            0
          );
          const userPercentage = currentUser?.incomePercentage || 0;
          userShare =
            totalPercentage > 0
              ? (e.amount * userPercentage) / totalPercentage
              : 0;
        } else {
          const userIncome = currentUser?.monthlyIncomeUSD || 0;
          userShare =
            totalIncomes > 0 ? (e.amount * userIncome) / totalIncomes : 0;
        }

        return sum + userShare;
      } else {
        return sum + (e.userId === userFilter ? e.amount : 0);
      }
    }, 0);

  const totalExpensesUSDT = expenses
    .filter((e) => e.currency === "USDT")
    .reduce((sum, e) => {
      if (e.isShared && e.account.isShared && e.account.users.length > 0) {
        const userIncomes: Record<string, number> = {};
        let totalIncomes = 0;

        for (const userAccount of e.account.users) {
          const userIncome = userAccount.user.monthlyIncomeUSDT || 0;
          userIncomes[userAccount.userId] = userIncome;
          totalIncomes += userIncome;
        }

        const usePercentageFallback = totalIncomes === 0;
        let userShare: number;

        if (usePercentageFallback) {
          const totalPercentage = e.account.users.reduce(
            (acc, ua) => acc + ua.user.incomePercentage,
            0
          );
          const userPercentage = currentUser?.incomePercentage || 0;
          userShare =
            totalPercentage > 0
              ? (e.amount * userPercentage) / totalPercentage
              : 0;
        } else {
          const userIncome = currentUser?.monthlyIncomeUSDT || 0;
          userShare =
            totalIncomes > 0 ? (e.amount * userIncome) / totalIncomes : 0;
        }

        return sum + userShare;
      } else {
        return sum + (e.userId === userFilter ? e.amount : 0);
      }
    }, 0);

  const totalExpensesCUP = expenses
    .filter(
      (e) => e.currency === "CUP_EFECTIVO" || e.currency === "CUP_TRANSFERENCIA"
    )
    .reduce((sum, e) => {
      if (e.isShared && e.account.isShared && e.account.users.length > 0) {
        const userIncomes: Record<string, number> = {};
        let totalIncomes = 0;

        for (const userAccount of e.account.users) {
          const userIncome = userAccount.user.monthlyIncomeCUP || 0;
          userIncomes[userAccount.userId] = userIncome;
          totalIncomes += userIncome;
        }

        const usePercentageFallback = totalIncomes === 0;
        let userShare: number;

        if (usePercentageFallback) {
          const totalPercentage = e.account.users.reduce(
            (acc, ua) => acc + ua.user.incomePercentage,
            0
          );
          const userPercentage = currentUser?.incomePercentage || 0;
          userShare =
            totalPercentage > 0
              ? (e.amount * userPercentage) / totalPercentage
              : 0;
        } else {
          const userIncome = currentUser?.monthlyIncomeCUP || 0;
          userShare =
            totalIncomes > 0 ? (e.amount * userIncome) / totalIncomes : 0;
        }

        return sum + userShare;
      } else {
        return sum + (e.userId === userFilter ? e.amount : 0);
      }
    }, 0);

  const plannedExpensesUSD = plannedExpenses
    .filter((e) => e.currency === "USD_ZELLE" || e.currency === "USD_EFECTIVO")
    .reduce((sum, e) => sum + e.amount, 0);
  const plannedExpensesUSDT = plannedExpenses
    .filter((e) => e.currency === "USDT")
    .reduce((sum, e) => sum + e.amount, 0);
  const plannedExpensesCUP = plannedExpenses
    .filter(
      (e) => e.currency === "CUP_EFECTIVO" || e.currency === "CUP_TRANSFERENCIA"
    )
    .reduce((sum, e) => sum + e.amount, 0);
  const totalIncomesUSD = incomes
    .filter((i) => i.currency === "USD_ZELLE" || i.currency === "USD_EFECTIVO")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalIncomesUSDT = incomes
    .filter((i) => i.currency === "USDT")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalIncomesCUP = incomes
    .filter(
      (i) => i.currency === "CUP_EFECTIVO" || i.currency === "CUP_TRANSFERENCIA"
    )
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
      } else if (
        e.currency === "CUP_EFECTIVO" ||
        e.currency === "CUP_TRANSFERENCIA"
      ) {
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
      } else if (
        e.currency === "CUP_EFECTIVO" ||
        e.currency === "CUP_TRANSFERENCIA"
      ) {
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
      } else if (
        i.currency === "CUP_EFECTIVO" ||
        i.currency === "CUP_TRANSFERENCIA"
      ) {
        acc[key].CUP += i.amount;
      }
      return acc;
    },
    {} as Record<string, { USD: number; USDT: number; CUP: number }>
  );

  const conversionsFromUSD = conversions
    .filter(
      (c) => c.fromCurrency === "USD_ZELLE" || c.fromCurrency === "USD_EFECTIVO"
    )
    .reduce((sum, c) => {
      if (c.account.isShared && c.account.users.length > 0) {
        const userIncomes: Record<string, number> = {};
        let totalIncomes = 0;

        for (const userAccount of c.account.users) {
          const userIncome = userAccount.user.monthlyIncomeUSD || 0;
          userIncomes[userAccount.userId] = userIncome;
          totalIncomes += userIncome;
        }

        const usePercentageFallback = totalIncomes === 0;
        let userShare: number;

        if (usePercentageFallback) {
          const totalPercentage = c.account.users.reduce(
            (acc, ua) => acc + ua.user.incomePercentage,
            0
          );
          const userPercentage = currentUser?.incomePercentage || 0;
          userShare =
            totalPercentage > 0
              ? (c.fromAmount * userPercentage) / totalPercentage
              : 0;
        } else {
          const userIncome = currentUser?.monthlyIncomeUSD || 0;
          userShare =
            totalIncomes > 0 ? (c.fromAmount * userIncome) / totalIncomes : 0;
        }

        return sum + userShare;
      } else {
        return sum + (c.userId === userFilter ? c.fromAmount : 0);
      }
    }, 0);

  const conversionsFromUSDT = conversions
    .filter((c) => c.fromCurrency === "USDT")
    .reduce((sum, c) => {
      if (c.account.isShared && c.account.users.length > 0) {
        const userIncomes: Record<string, number> = {};
        let totalIncomes = 0;

        for (const userAccount of c.account.users) {
          const userIncome = userAccount.user.monthlyIncomeUSDT || 0;
          userIncomes[userAccount.userId] = userIncome;
          totalIncomes += userIncome;
        }

        const usePercentageFallback = totalIncomes === 0;
        let userShare: number;

        if (usePercentageFallback) {
          const totalPercentage = c.account.users.reduce(
            (acc, ua) => acc + ua.user.incomePercentage,
            0
          );
          const userPercentage = currentUser?.incomePercentage || 0;
          userShare =
            totalPercentage > 0
              ? (c.fromAmount * userPercentage) / totalPercentage
              : 0;
        } else {
          const userIncome = currentUser?.monthlyIncomeUSDT || 0;
          userShare =
            totalIncomes > 0 ? (c.fromAmount * userIncome) / totalIncomes : 0;
        }

        return sum + userShare;
      } else {
        return sum + (c.userId === userFilter ? c.fromAmount : 0);
      }
    }, 0);

  const conversionsToCUP = conversions
    .filter(
      (c) =>
        c.toCurrency === "CUP_EFECTIVO" || c.toCurrency === "CUP_TRANSFERENCIA"
    )
    .reduce((sum, c) => sum + c.toAmount, 0);

  const totalBalanceUSD = userAccounts.reduce(
    (sum, account) =>
      sum + (account.balanceUSDZelle || 0) + (account.balanceUSDEfectivo || 0),
    0
  );
  const totalBalanceUSDT = userAccounts.reduce(
    (sum, account) => sum + (account.balanceUSDT || 0),
    0
  );
  const totalBalanceCUP = userAccounts.reduce(
    (sum, account) =>
      sum +
      (account.balanceCUPEfectivo || 0) +
      (account.balanceCUPTransferencia || 0),
    0
  );

  const availableBalanceUSD = totalBalanceUSD - plannedExpensesUSD;
  const availableBalanceUSDT = totalBalanceUSDT - plannedExpensesUSDT;
  const availableBalanceCUP = totalBalanceCUP - plannedExpensesCUP;

  const sharedExpensesUSD = expenses
    .filter(
      (e) =>
        e.isShared &&
        (e.currency === "USD_ZELLE" || e.currency === "USD_EFECTIVO")
    )
    .reduce((sum, e) => sum + e.amount, 0);
  const sharedExpensesUSDT = expenses
    .filter((e) => e.isShared && e.currency === "USDT")
    .reduce((sum, e) => sum + e.amount, 0);
  const sharedExpensesCUP = expenses
    .filter(
      (e) =>
        e.isShared &&
        (e.currency === "CUP_EFECTIVO" || e.currency === "CUP_TRANSFERENCIA")
    )
    .reduce((sum, e) => sum + e.amount, 0);

  const personalExpensesUSD = expenses
    .filter(
      (e) =>
        !e.isShared &&
        (e.currency === "USD_ZELLE" || e.currency === "USD_EFECTIVO")
    )
    .reduce((sum, e) => sum + e.amount, 0);
  const personalExpensesUSDT = expenses
    .filter((e) => !e.isShared && e.currency === "USDT")
    .reduce((sum, e) => sum + e.amount, 0);
  const personalExpensesCUP = expenses
    .filter(
      (e) =>
        !e.isShared &&
        (e.currency === "CUP_EFECTIVO" || e.currency === "CUP_TRANSFERENCIA")
    )
    .reduce((sum, e) => sum + e.amount, 0);

  const houseExpensesUSD = expenses
    .filter(
      (e) =>
        e.category.name === "Casa" &&
        (e.currency === "USD_ZELLE" || e.currency === "USD_EFECTIVO")
    )
    .reduce((sum, e) => sum + e.amount, 0);
  const houseExpensesUSDT = expenses
    .filter((e) => e.category.name === "Casa" && e.currency === "USDT")
    .reduce((sum, e) => sum + e.amount, 0);
  const houseExpensesCUP = expenses
    .filter(
      (e) =>
        e.category.name === "Casa" &&
        (e.currency === "CUP_EFECTIVO" || e.currency === "CUP_TRANSFERENCIA")
    )
    .reduce((sum, e) => sum + e.amount, 0);

  const houseAccountIncomesUSD = sharedHouseIncomes
    .filter(
      (i) =>
        i.account.isShared &&
        i.account.name.includes("Casa") &&
        (i.currency === "USD_ZELLE" || i.currency === "USD_EFECTIVO")
    )
    .reduce((sum, i) => sum + i.amount, 0);
  const houseAccountIncomesUSDT = sharedHouseIncomes
    .filter(
      (i) =>
        i.account.isShared &&
        i.account.name.includes("Casa") &&
        i.currency === "USDT"
    )
    .reduce((sum, i) => sum + i.amount, 0);
  const houseAccountIncomesCUP = sharedHouseIncomes
    .filter(
      (i) =>
        i.account.isShared &&
        i.account.name.includes("Casa") &&
        (i.currency === "CUP_EFECTIVO" || i.currency === "CUP_TRANSFERENCIA")
    )
    .reduce((sum, i) => sum + i.amount, 0);

  const houseAccountExpensesUSD = expenses
    .filter(
      (e) =>
        e.account.isShared &&
        e.account.name.includes("Casa") &&
        (e.currency === "USD_ZELLE" || e.currency === "USD_EFECTIVO")
    )
    .reduce((sum, e) => sum + e.amount, 0);
  const houseAccountExpensesUSDT = expenses
    .filter(
      (e) =>
        e.account.isShared &&
        e.account.name.includes("Casa") &&
        e.currency === "USDT"
    )
    .reduce((sum, e) => sum + e.amount, 0);
  const houseAccountExpensesCUP = expenses
    .filter(
      (e) =>
        e.account.isShared &&
        e.account.name.includes("Casa") &&
        (e.currency === "CUP_EFECTIVO" || e.currency === "CUP_TRANSFERENCIA")
    )
    .reduce((sum, e) => sum + e.amount, 0);

  return NextResponse.json({
    totals: {
      expenses: {
        USD: totalExpensesUSD,
        USDT: totalExpensesUSDT,
        CUP: totalExpensesCUP,
      },
      plannedExpenses: {
        USD: plannedExpensesUSD,
        USDT: plannedExpensesUSDT,
        CUP: plannedExpensesCUP,
      },
      incomes: {
        USD: totalIncomesUSD,
        USDT: totalIncomesUSDT,
        CUP: totalIncomesCUP,
      },
      balance: {
        USD: totalBalanceUSD,
        USDT: totalBalanceUSDT,
        CUP: totalBalanceCUP,
      },
      availableBalance: {
        USD: availableBalanceUSD,
        USDT: availableBalanceUSDT,
        CUP: availableBalanceCUP,
      },
      sharedExpenses: {
        USD: sharedExpensesUSD,
        USDT: sharedExpensesUSDT,
        CUP: sharedExpensesCUP,
      },
      personalExpenses: {
        USD: personalExpensesUSD,
        USDT: personalExpensesUSDT,
        CUP: personalExpensesCUP,
      },
      houseExpenses: {
        USD: houseExpensesUSD,
        USDT: houseExpensesUSDT,
        CUP: houseExpensesCUP,
      },
      houseAccountIncomes: {
        USD: houseAccountIncomesUSD,
        USDT: houseAccountIncomesUSDT,
        CUP: houseAccountIncomesCUP,
      },
      houseAccountExpenses: {
        USD: houseAccountExpensesUSD,
        USDT: houseAccountExpensesUSDT,
        CUP: houseAccountExpensesCUP,
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
