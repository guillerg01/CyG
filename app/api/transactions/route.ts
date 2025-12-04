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
  const type = searchParams.get("type");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = searchParams.get("limit");

  const where: Record<string, unknown> = { userId: session.id };

  if (accountId) {
    where.accountId = accountId;
  }
  if (type) {
    where.type = type;
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

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      account: true,
    },
    orderBy: { createdAt: "desc" },
    ...(limit && { take: parseInt(limit) }),
  });

  return NextResponse.json(transactions);
}

