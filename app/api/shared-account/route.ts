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

  const userAccounts = await prisma.userAccount.findMany({
    where: { userId: session.id },
    select: { accountId: true },
  });

  const userAccountIds = userAccounts.map((ua) => ua.accountId);

  const sharedHouseAccount = await prisma.account.findFirst({
    where: {
      id: { in: userAccountIds },
      isShared: true,
      name: { contains: "Casa" },
    },
  });

  if (!sharedHouseAccount) {
    return NextResponse.json({
      account: null,
      incomes: [],
      expenses: [],
      conversions: [],
      transfers: [],
      loans: [],
    });
  }

  const dateFilter: Record<string, unknown> = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) {
      (dateFilter.createdAt as Record<string, unknown>).gte = new Date(startDate);
    }
    if (endDate) {
      (dateFilter.createdAt as Record<string, unknown>).lte = new Date(endDate);
    }
  }

  const [incomes, expenses, conversions, transfers, loans] = await Promise.all([
    prisma.income.findMany({
      where: {
        accountId: sharedHouseAccount.id,
        ...dateFilter,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({
      where: {
        OR: [
          { accountId: sharedHouseAccount.id },
          {
            isShared: true,
            accountId: { in: userAccountIds },
            category: {
              name: "Casa",
            },
          },
        ],
        ...dateFilter,
      },
      include: {
        category: true,
        account: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.conversion.findMany({
      where: {
        OR: [
          { accountId: sharedHouseAccount.id },
          {
            AND: [
              { accountId: { in: userAccountIds } },
              {
                toCurrency: {
                  in: ["CUP_EFECTIVO", "CUP_TRANSFERENCIA"],
                },
              },
              {
                account: {
                  isShared: true,
                },
              },
            ],
          },
        ],
        ...dateFilter,
      },
      include: {
        account: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transfer.findMany({
      where: {
        OR: [
          { fromAccountId: sharedHouseAccount.id },
          { toAccountId: sharedHouseAccount.id },
        ],
        ...dateFilter,
      },
      include: {
        fromAccount: true,
        toAccount: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.loan.findMany({
      where: {
        OR: [
          { fromAccountId: sharedHouseAccount.id },
          { toAccountId: sharedHouseAccount.id },
        ],
        ...dateFilter,
      },
      include: {
        fromAccount: true,
        toAccount: true,
        giver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    account: sharedHouseAccount,
    incomes,
    expenses,
    conversions,
    transfers,
    loans,
  });
}

