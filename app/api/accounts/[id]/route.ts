import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const account = await prisma.account.findFirst({
    where: {
      id,
      users: {
        some: {
          userId: session.id,
        },
      },
    },
    include: {
      users: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json(account);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, isShared } = body;

  const account = await prisma.account.updateMany({
    where: {
      id,
      users: {
        some: {
          userId: session.id,
          role: "owner",
        },
      },
    },
    data: {
      ...(name && { name }),
      ...(isShared !== undefined && { isShared }),
    },
  });

  if (account.count === 0) {
    return NextResponse.json({ error: "Account not found or unauthorized" }, { status: 404 });
  }

  const updated = await prisma.account.findUnique({ where: { id } });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const account = await prisma.account.deleteMany({
    where: {
      id,
      users: {
        some: {
          userId: session.id,
          role: "owner",
        },
      },
    },
  });

  if (account.count === 0) {
    return NextResponse.json({ error: "Account not found or unauthorized" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

