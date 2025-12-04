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
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = searchParams.get("limit");

  const where: Record<string, unknown> = { userId: session.id };

  if (accountId) {
    where.accountId = accountId;
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

  const incomes = await prisma.income.findMany({
    where,
    include: {
      account: true,
    },
    orderBy: { createdAt: "desc" },
    ...(limit && { take: parseInt(limit) }),
  });

  return NextResponse.json(incomes);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { amount, description, currency, accountId, createdAt } = body;

  if (!amount || !currency || !accountId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const income = await prisma.income.create({
    data: {
      amount,
      description,
      currency,
      userId: session.id,
      accountId,
      ...(createdAt && { createdAt: new Date(createdAt) }),
    },
    include: {
      account: true,
    },
  });

  const field = currency === "USD" ? "balanceUSD" : "balanceUSDT";
  await prisma.account.update({
    where: { id: accountId },
    data: { [field]: { increment: amount } },
  });

  await prisma.transaction.create({
    data: {
      type: "INCOME",
      amount,
      currency,
      description,
      referenceId: income.id,
      userId: session.id,
      accountId,
    },
  });

  await prisma.change.create({
    data: {
      action: "CREATE",
      entityType: "INCOME",
      entityId: income.id,
      newValue: JSON.stringify(income),
      authorId: session.id,
      incomeId: income.id,
    },
  });

  return NextResponse.json(income);
}

