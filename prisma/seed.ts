import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 12);

  const user1 = await prisma.user.upsert({
    where: { email: "usuario1@example.com" },
    update: {},
    create: {
      email: "usuario1@example.com",
      name: "Usuario 1",
      password: hashedPassword,
      incomePercentage: 60,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "usuario2@example.com" },
    update: {},
    create: {
      email: "usuario2@example.com",
      name: "Usuario 2",
      password: hashedPassword,
      incomePercentage: 40,
    },
  });

  const personalAccount = await prisma.account.create({
    data: {
      name: "Personal",
      balanceUSDZelle: 1000,
      balanceUSDEfectivo: 500,
      balanceUSDT: 300,
      balanceCUPEfectivo: 0,
      balanceCUPTransferencia: 0,
      isShared: false,
    },
  });

  const sharedAccount = await prisma.account.create({
    data: {
      name: "Casa",
      balanceUSDZelle: 2000,
      balanceUSDEfectivo: 1000,
      balanceUSDT: 500,
      balanceCUPEfectivo: 0,
      balanceCUPTransferencia: 0,
      isShared: true,
    },
  });

  await prisma.userAccount.createMany({
    data: [
      { userId: user1.id, accountId: personalAccount.id, role: "owner" },
      { userId: user1.id, accountId: sharedAccount.id, role: "owner" },
      { userId: user2.id, accountId: sharedAccount.id, role: "member" },
    ],
  });

  const categories = [
    { name: "Casa", color: "#10b981" },
    { name: "Comida", color: "#f59e0b" },
    { name: "Transporte", color: "#3b82f6" },
    { name: "Entretenimiento", color: "#8b5cf6" },
    { name: "Salud", color: "#ef4444" },
    { name: "Recarga", color: "#06b6d4" },
    { name: "Remesa", color: "#ec4899" },
    { name: "Servicios", color: "#84cc16" },
    { name: "Otros", color: "#6b7280" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
