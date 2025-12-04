import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBalanceField } from "@/features/incomes/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const income = await prisma.income.findFirst({
    where: { id, userId: session.id },
    include: {
      account: true,
    },
  });

  if (!income) {
    return NextResponse.json({ error: "Income not found" }, { status: 404 });
  }

  return NextResponse.json(income);
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

  const existing = await prisma.income.findFirst({
    where: { id, userId: session.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Income not found" }, { status: 404 });
  }

  const { amount, description, currency, createdAt } = body;

  if (amount !== undefined) {
    const oldField = getBalanceField(existing.currency);
    await prisma.account.update({
      where: { id: existing.accountId },
      data: { [oldField]: { decrement: existing.amount } },
    });

    const newCurrency = currency || existing.currency;
    const newField = getBalanceField(newCurrency);
    await prisma.account.update({
      where: { id: existing.accountId },
      data: { [newField]: { increment: amount } },
    });
  }

  const income = await prisma.income.update({
    where: { id },
    data: {
      ...(amount !== undefined && { amount }),
      ...(description !== undefined && { description }),
      ...(currency && { currency }),
      ...(createdAt && { createdAt: new Date(createdAt) }),
    },
    include: {
      account: true,
    },
  });

  await prisma.change.create({
    data: {
      action: "UPDATE",
      entityType: "INCOME",
      entityId: income.id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(income),
      authorId: session.id,
      incomeId: income.id,
    },
  });

  return NextResponse.json(income);
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

  const existing = await prisma.income.findFirst({
    where: { id, userId: session.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Income not found" }, { status: 404 });
  }

  const field = getBalanceField(existing.currency);
  await prisma.account.update({
    where: { id: existing.accountId },
    data: { [field]: { decrement: existing.amount } },
  });

  await prisma.income.delete({ where: { id } });

  await prisma.change.create({
    data: {
      action: "DELETE",
      entityType: "INCOME",
      entityId: id,
      oldValue: JSON.stringify(existing),
      authorId: session.id,
    },
  });

  return NextResponse.json({ success: true });
}

