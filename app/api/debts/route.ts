import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBalanceField } from "@/features/debts/utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isPaid = searchParams.get("isPaid");

  const where: Record<string, unknown> = { userId: session.id };
  if (isPaid !== null) {
    where.isPaid = isPaid === "true";
  }

  const debts = await prisma.debt.findMany({
    where,
    include: {
      account: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(debts);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { amount, description, currency, dueDate, creditor, accountId } = body;

  if (!amount || !currency || !creditor || !accountId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const debt = await prisma.debt.create({
    data: {
      amount,
      description,
      currency,
      dueDate: dueDate ? new Date(dueDate) : null,
      creditor,
      userId: session.id,
      accountId,
    },
    include: {
      account: true,
    },
  });

  const field = getBalanceField(currency);
  await prisma.account.update({
    where: { id: accountId },
    data: { [field]: { decrement: amount } },
  });

  await prisma.transaction.create({
    data: {
      type: "DEBT",
      amount: -amount,
      currency,
      description: `Debt to ${creditor}`,
      referenceId: debt.id,
      userId: session.id,
      accountId,
    },
  });

  await prisma.change.create({
    data: {
      action: "CREATE",
      entityType: "DEBT",
      entityId: debt.id,
      newValue: JSON.stringify(debt),
      authorId: session.id,
      debtId: debt.id,
    },
  });

  return NextResponse.json(debt);
}

