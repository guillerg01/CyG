import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      incomePercentage: true,
      monthlyIncomeUSD: true,
      monthlyIncomeUSDT: true,
      monthlyIncomeCUP: true,
    },
  });

  return NextResponse.json(users);
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, avatar, incomePercentage, monthlyIncomeUSD, monthlyIncomeUSDT, monthlyIncomeCUP, pin } = body;

  const updateData: Record<string, unknown> = {};
  if (name) {
    updateData.name = name;
  }
  if (avatar) {
    updateData.avatar = avatar;
  }
  if (incomePercentage !== undefined) {
    updateData.incomePercentage = incomePercentage;
  }
  if (monthlyIncomeUSD !== undefined) {
    updateData.monthlyIncomeUSD = monthlyIncomeUSD;
  }
  if (monthlyIncomeUSDT !== undefined) {
    updateData.monthlyIncomeUSDT = monthlyIncomeUSDT;
  }
  if (monthlyIncomeCUP !== undefined) {
    updateData.monthlyIncomeCUP = monthlyIncomeCUP;
  }
  if (pin) {
    updateData.pin = pin;
  }

  const user = await prisma.user.update({
    where: { id: session.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      incomePercentage: true,
      monthlyIncomeUSD: true,
      monthlyIncomeUSDT: true,
      monthlyIncomeCUP: true,
    },
  });

  return NextResponse.json(user);
}

