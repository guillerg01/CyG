import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const field = currency === "USD" ? "balanceUSD" : "balanceUSDT";
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

