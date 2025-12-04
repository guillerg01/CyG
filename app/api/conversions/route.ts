import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBalanceField } from "@/features/conversions/utils";

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
  const { fromAmount, fromCurrency, toCurrency, exchangeRate, fromAccountId, toAccountId } = body;

  if (!fromAmount || !fromCurrency || !toCurrency || !exchangeRate || !fromAccountId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const toAmount = fromAmount * exchangeRate;
  const targetAccountId = toAccountId || fromAccountId;

  const fromAccount = await prisma.account.findUnique({
    where: { id: fromAccountId },
  });

  const toAccount = await prisma.account.findUnique({
    where: { id: targetAccountId },
  });

  if (!fromAccount || !toAccount) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const conversion = await prisma.conversion.create({
    data: {
      fromAmount,
      toAmount,
      fromCurrency,
      toCurrency,
      exchangeRate,
      userId: session.id,
      accountId: fromAccountId,
    },
    include: {
      account: true,
    },
  });

  const fromField = getBalanceField(fromCurrency);
  const toField = getBalanceField(toCurrency);

  await prisma.account.update({
    where: { id: fromAccountId },
    data: {
      [fromField]: { decrement: fromAmount },
    },
  });

  if (fromAccountId === targetAccountId) {
    await prisma.account.update({
      where: { id: targetAccountId },
      data: {
        [toField]: { increment: toAmount },
      },
    });
  } else {
    await prisma.account.update({
      where: { id: targetAccountId },
      data: {
        [toField]: { increment: toAmount },
      },
    });

    if (toAccount.isShared && toAccount.name.includes("Casa") && (toCurrency === "CUP_EFECTIVO" || toCurrency === "CUP_TRANSFERENCIA")) {
      await prisma.income.create({
        data: {
          amount: toAmount,
          currency: toCurrency,
          description: `Conversión de ${fromAmount} ${fromCurrency} a ${toAmount.toFixed(2)} ${toCurrency} (tasa: ${exchangeRate})`,
          userId: session.id,
          accountId: targetAccountId,
        },
      });

      // Buscar y devolver préstamos pendientes de CUP de cuentas personales (no compartidas) a la cuenta compartida
      const pendingLoans = await prisma.loan.findMany({
        where: {
          toAccountId: targetAccountId,
          currency: {
            in: ["CUP_EFECTIVO", "CUP_TRANSFERENCIA"],
          },
          isPaid: false,
        },
        include: {
          fromAccount: {
            include: {
              users: true,
            },
          },
        },
      });

      // Filtrar solo préstamos desde cuentas personales (no compartidas) hacia la cuenta compartida
      const personalLoans = pendingLoans.filter(
        (loan) => !loan.fromAccount.isShared && loan.toAccountId === targetAccountId
      );

      let remainingCUP = toAmount;
      for (const loan of personalLoans) {
        if (remainingCUP <= 0) break;

        const remainingLoan = loan.amount - loan.paidAmount;
        const repaymentAmount = Math.min(remainingLoan, remainingCUP);

        if (repaymentAmount > 0) {
          const newPaidAmount = loan.paidAmount + repaymentAmount;
          const isFullyPaid = newPaidAmount >= loan.amount;

          await prisma.loan.update({
            where: { id: loan.id },
            data: {
              paidAmount: newPaidAmount,
              isPaid: isFullyPaid,
              paidDate: isFullyPaid ? new Date() : null,
            },
          });

          // Devolver a la cuenta personal
          const fromField = getBalanceField(toCurrency);
          await prisma.account.update({
            where: { id: loan.fromAccountId },
            data: {
              [fromField]: { increment: repaymentAmount },
            },
          });

          // Descontar de la cuenta compartida
          await prisma.account.update({
            where: { id: targetAccountId },
            data: {
              [toField]: { decrement: repaymentAmount },
            },
          });

          remainingCUP -= repaymentAmount;
        }
      }
    }
  }

  await prisma.transaction.create({
    data: {
      type: "CONVERSION",
      amount: fromAmount,
      currency: fromCurrency,
      description: `Converted ${fromAmount} ${fromCurrency} to ${toAmount.toFixed(2)} ${toCurrency}`,
      referenceId: conversion.id,
      userId: session.id,
      accountId: fromAccountId,
    },
  });

  return NextResponse.json(conversion);
}

