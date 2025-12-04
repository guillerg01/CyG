import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBalanceField } from "@/features/loans/utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  let where: Record<string, unknown> = {};

  if (type === "given") {
    where = { giverId: session.id };
  } else if (type === "received") {
    where = { receiverId: session.id };
  } else {
    where = {
      OR: [{ giverId: session.id }, { receiverId: session.id }],
    };
  }

  const loans = await prisma.loan.findMany({
    where,
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
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(loans);
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
    dueDate,
    receiverId,
    fromAccountId,
    toAccountId,
  } = body;

  if (!amount || !currency || !receiverId || !fromAccountId || !toAccountId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const loan = await prisma.loan.create({
    data: {
      amount,
      description,
      currency,
      dueDate: dueDate ? new Date(dueDate) : null,
      giverId: session.id,
      receiverId,
      fromAccountId,
      toAccountId,
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

  const field = getBalanceField(currency);
  await prisma.account.update({
    where: { id: fromAccountId },
    data: { [field]: { decrement: amount } },
  });
  await prisma.account.update({
    where: { id: toAccountId },
    data: { [field]: { increment: amount } },
  });

  await prisma.transaction.create({
    data: {
      type: "LOAN",
      amount,
      currency,
      description: `Loan to ${loan.receiver.name}`,
      referenceId: loan.id,
      userId: session.id,
      accountId: fromAccountId,
    },
  });

  await prisma.change.create({
    data: {
      action: "CREATE",
      entityType: "LOAN",
      entityId: loan.id,
      newValue: JSON.stringify(loan),
      authorId: session.id,
      loanId: loan.id,
    },
  });

  return NextResponse.json(loan);
}

