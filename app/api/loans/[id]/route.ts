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

  const loan = await prisma.loan.findFirst({
    where: {
      id,
      OR: [{ giverId: session.id }, { receiverId: session.id }],
    },
    include: {
      giver: {
        select: { id: true, name: true, email: true },
      },
      receiver: {
        select: { id: true, name: true, email: true },
      },
      fromAccount: true,
      toAccount: true,
    },
  });

  if (!loan) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }

  return NextResponse.json(loan);
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
  const { paymentAmount, paymentCurrency, exchangeRate } = body;

  const loan = await prisma.loan.findFirst({
    where: {
      id,
      OR: [{ giverId: session.id }, { receiverId: session.id }],
    },
    include: {
      giver: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
    },
  });

  if (!loan) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }

  let effectivePayment = paymentAmount;
  if (paymentCurrency && paymentCurrency !== loan.currency && exchangeRate) {
    effectivePayment = paymentAmount * exchangeRate;
  }

  const newPaidAmount = loan.paidAmount + effectivePayment;
  const isPaid = newPaidAmount >= loan.amount;

  const updated = await prisma.loan.update({
    where: { id },
    data: {
      paidAmount: newPaidAmount,
      isPaid,
      ...(isPaid && { paidDate: new Date() }),
    },
  });

  const field = (paymentCurrency || loan.currency) === "USD" ? "balanceUSD" : "balanceUSDT";
  await prisma.account.update({
    where: { id: loan.toAccountId },
    data: { [field]: { decrement: paymentAmount } },
  });
  await prisma.account.update({
    where: { id: loan.fromAccountId },
    data: { [field]: { increment: paymentAmount } },
  });

  await prisma.transaction.create({
    data: {
      type: "LOAN_PAYMENT",
      amount: paymentAmount,
      currency: paymentCurrency || loan.currency,
      description: `Loan payment from ${loan.receiver.name}`,
      referenceId: loan.id,
      userId: session.id,
      accountId: loan.fromAccountId,
    },
  });

  await prisma.change.create({
    data: {
      action: "UPDATE",
      entityType: "LOAN",
      entityId: loan.id,
      oldValue: JSON.stringify(loan),
      newValue: JSON.stringify(updated),
      authorId: session.id,
      loanId: loan.id,
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

  const loan = await prisma.loan.findFirst({
    where: { id, giverId: session.id },
  });

  if (!loan) {
    return NextResponse.json({ error: "Loan not found or unauthorized" }, { status: 404 });
  }

  if (!loan.isPaid) {
    const remaining = loan.amount - loan.paidAmount;
    const field = loan.currency === "USD" ? "balanceUSD" : "balanceUSDT";
    await prisma.account.update({
      where: { id: loan.fromAccountId },
      data: { [field]: { increment: remaining } },
    });
    await prisma.account.update({
      where: { id: loan.toAccountId },
      data: { [field]: { decrement: remaining } },
    });
  }

  await prisma.loan.delete({ where: { id } });

  await prisma.change.create({
    data: {
      action: "DELETE",
      entityType: "LOAN",
      entityId: id,
      oldValue: JSON.stringify(loan),
      authorId: session.id,
    },
  });

  return NextResponse.json({ success: true });
}

