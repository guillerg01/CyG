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

  const debt = await prisma.debt.findFirst({
    where: { id, userId: session.id },
    include: {
      account: true,
    },
  });

  if (!debt) {
    return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  }

  return NextResponse.json(debt);
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
  const { paymentAmount } = body;

  const debt = await prisma.debt.findFirst({
    where: { id, userId: session.id },
  });

  if (!debt) {
    return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  }

  const newPaidAmount = debt.paidAmount + paymentAmount;
  const isPaid = newPaidAmount >= debt.amount;

  const updated = await prisma.debt.update({
    where: { id },
    data: {
      paidAmount: newPaidAmount,
      isPaid,
      ...(isPaid && { paidDate: new Date() }),
    },
    include: {
      account: true,
    },
  });

  await prisma.transaction.create({
    data: {
      type: "DEBT_PAYMENT",
      amount: paymentAmount,
      currency: debt.currency,
      description: `Debt payment to ${debt.creditor}`,
      referenceId: debt.id,
      userId: session.id,
      accountId: debt.accountId,
    },
  });

  await prisma.change.create({
    data: {
      action: "UPDATE",
      entityType: "DEBT",
      entityId: debt.id,
      oldValue: JSON.stringify(debt),
      newValue: JSON.stringify(updated),
      authorId: session.id,
      debtId: debt.id,
    },
  });

  return NextResponse.json(updated);
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

  const debt = await prisma.debt.findFirst({
    where: { id, userId: session.id },
  });

  if (!debt) {
    return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  }

  if (!debt.isPaid) {
    const remaining = debt.amount - debt.paidAmount;
    const field = debt.currency === "USD" ? "balanceUSD" : "balanceUSDT";
    await prisma.account.update({
      where: { id: debt.accountId },
      data: { [field]: { increment: remaining } },
    });
  }

  await prisma.debt.delete({ where: { id } });

  await prisma.change.create({
    data: {
      action: "DELETE",
      entityType: "DEBT",
      entityId: id,
      oldValue: JSON.stringify(debt),
      authorId: session.id,
    },
  });

  return NextResponse.json({ success: true });
}

