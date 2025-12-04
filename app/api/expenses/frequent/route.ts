import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "6");

  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.id,
      expenseType: "REALIZED",
    },
    include: {
      category: true,
      account: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const frequentExpenses = expenses.reduce(
    (acc, expense) => {
      const descriptionKey = expense.description
        ? expense.description.toLowerCase().trim()
        : "";
      const key = `${expense.category.name}-${expense.currency}-${expense.paymentMethod}-${descriptionKey}`;
      
      if (!acc[key]) {
        acc[key] = {
          category: {
            id: expense.category.id,
            name: expense.category.name,
            color: expense.category.color || "#6b7280",
          },
          currency: expense.currency,
          paymentMethod: expense.paymentMethod,
          amount: expense.amount,
          description: expense.description,
          count: 0,
          lastUsed: expense.createdAt,
        };
      }
      acc[key].count += 1;
      if (new Date(expense.createdAt) > new Date(acc[key].lastUsed)) {
        acc[key].lastUsed = expense.createdAt;
        acc[key].amount = expense.amount;
        acc[key].description = expense.description;
      }
      return acc;
    },
    {} as Record<
      string,
      {
        category: { id: string; name: string; color: string };
        currency: string;
        paymentMethod: string;
        amount: number;
        description: string | null;
        count: number;
        lastUsed: Date;
      }
    >
  );

  let sortedFrequent = Object.values(frequentExpenses)
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
    })
    .slice(0, limit);

  if (sortedFrequent.length < limit && expenses.length > 0) {
    const recentExpenses = expenses
      .slice(0, limit - sortedFrequent.length)
      .map((expense) => ({
        category: {
          id: expense.category.id,
          name: expense.category.name,
          color: expense.category.color || "#6b7280",
        },
        currency: expense.currency,
        paymentMethod: expense.paymentMethod,
        amount: expense.amount,
        description: expense.description,
        count: 1,
        lastUsed: expense.createdAt,
      }));
    
    const existingKeys = new Set(
      sortedFrequent.map(
        (e) => `${e.category.name}-${e.currency}-${e.paymentMethod}-${e.description?.toLowerCase().trim() || ""}`
      )
    );
    
    const uniqueRecent = recentExpenses.filter(
      (e) =>
        !existingKeys.has(
          `${e.category.name}-${e.currency}-${e.paymentMethod}-${e.description?.toLowerCase().trim() || ""}`
        )
    );
    
    sortedFrequent = [...sortedFrequent, ...uniqueRecent].slice(0, limit);
  }

  return NextResponse.json(sortedFrequent);
}

