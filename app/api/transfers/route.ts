import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBalanceField } from "@/shared/utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  const where: Record<string, unknown> = { userId: session.id };
  if (accountId) {
    where.OR = [
      { fromAccountId: accountId },
      { toAccountId: accountId },
    ];
  }

  const transfers = await prisma.transfer.findMany({
    where,
    include: {
      fromAccount: true,
      toAccount: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(transfers);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { amount, description, currency, fromAccountId, toAccountId } = body;

  if (!amount || !currency || !fromAccountId || !toAccountId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (fromAccountId === toAccountId) {
    return NextResponse.json({ error: "Cannot transfer to the same account" }, { status: 400 });
  }

  const fromAccount = await prisma.account.findUnique({
    where: { id: fromAccountId },
  });

  const toAccount = await prisma.account.findUnique({
    where: { id: toAccountId },
  });

  if (!fromAccount || !toAccount) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const field = getBalanceField(currency);

  const fromBalance = fromAccount[field as keyof typeof fromAccount] as number;
  if (fromBalance < amount) {
    return NextResponse.json(
      { error: "Insufficient balance in source account" },
      { status: 400 }
    );
  }

  const transfer = await prisma.transfer.create({
    data: {
      amount,
      description,
      currency,
      userId: session.id,
      fromAccountId,
      toAccountId,
    },
    include: {
      fromAccount: true,
      toAccount: true,
    },
  });

  await prisma.account.update({
    where: { id: fromAccountId },
    data: {
      [field]: { decrement: amount },
    },
  });

  await prisma.account.update({
    where: { id: toAccountId },
    data: {
      [field]: { increment: amount },
    },
  });

  await prisma.transaction.create({
    data: {
      type: "TRANSFER",
      amount,
      currency,
      description: description || `Transfer from ${fromAccount.name} to ${toAccount.name}`,
      referenceId: transfer.id,
      userId: session.id,
      accountId: fromAccountId,
    },
  });

  await prisma.transaction.create({
    data: {
      type: "TRANSFER",
      amount,
      currency,
      description: description || `Transfer from ${fromAccount.name} to ${toAccount.name}`,
      referenceId: transfer.id,
      userId: session.id,
      accountId: toAccountId,
    },
  });

  return NextResponse.json(transfer);
}

