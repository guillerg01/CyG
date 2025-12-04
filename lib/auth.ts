import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) {
    return null;
  }
  return verifyToken(token);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Invalid credentials" };
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return { error: "Invalid credentials" };
  }

  const token = generateToken({ id: user.id, email: user.email, name: user.name });
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}

export async function register(email: string, password: string, name: string) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "Email already exists" };
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });

  const defaultAccount = await prisma.account.create({
    data: {
      name: "Personal",
      balanceUSDZelle: 0,
      balanceUSDEfectivo: 0,
      balanceUSDT: 0,
      balanceCUPEfectivo: 0,
      balanceCUPTransferencia: 0,
    },
  });

  await prisma.userAccount.create({
    data: { userId: user.id, accountId: defaultAccount.id, role: "owner" },
  });

  const token = generateToken({ id: user.id, email: user.email, name: user.name });
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.pin) {
    return false;
  }
  return user.pin === pin;
}

