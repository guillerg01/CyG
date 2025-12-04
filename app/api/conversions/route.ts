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

  const where: Record<string, unknown> = { userId: session.id };
  if (accountId) {
    where.accountId = accountId;
  }

  const conversions = await prisma.conversion.findMany({
    where,
    include: {
      account: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(conversions);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { fromAmount, fromCurrency, toCurrency, exchangeRate, accountId } = body;

  if (!fromAmount || !fromCurrency || !toCurrency || !exchangeRate || !accountId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const toAmount = fromAmount * exchangeRate;

  const conversion = await prisma.conversion.create({
    data: {
      fromAmount,
      toAmount,
      fromCurrency,
      toCurrency,
      exchangeRate,
      userId: session.id,
      accountId,
    },
    include: {
      account: true,
    },
  });

  const fromField = fromCurrency === "USD" ? "balanceUSD" : "balanceUSDT";
  const toField = toCurrency === "USD" ? "balanceUSD" : "balanceUSDT";

  await prisma.account.update({
    where: { id: accountId },
    data: {
      [fromField]: { decrement: fromAmount },
      [toField]: { increment: toAmount },
    },
  });

  await prisma.transaction.create({
    data: {
      type: "CONVERSION",
      amount: fromAmount,
      currency: fromCurrency,
      description: `Converted ${fromAmount} ${fromCurrency} to ${toAmount.toFixed(2)} ${toCurrency}`,
      referenceId: conversion.id,
      userId: session.id,
      accountId,
    },
  });

  return NextResponse.json(conversion);
}

