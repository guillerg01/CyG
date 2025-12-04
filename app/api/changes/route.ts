import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const limit = searchParams.get("limit");

  const where: Record<string, unknown> = {};
  if (entityType) {
    where.entityType = entityType;
  }

  const changes = await prisma.change.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    ...(limit && { take: parseInt(limit) }),
  });

  return NextResponse.json(changes);
}

