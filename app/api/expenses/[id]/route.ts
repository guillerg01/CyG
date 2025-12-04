import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const oldField = existing.currency === "USD" ? "balanceUSD" : "balanceUSDT";
    await prisma.account.update({
      where: { id: existing.accountId },
      data: { [oldField]: { increment: existing.amount } },
    });

    const newCurrency = currency || existing.currency;
    const newField = newCurrency === "USD" ? "balanceUSD" : "balanceUSDT";
    await prisma.account.update({
      where: { id: existing.accountId },
      data: { [newField]: { decrement: amount } },
    });
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
    const field = existing.currency === "USD" ? "balanceUSD" : "balanceUSDT";
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

