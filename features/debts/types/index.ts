import { Currency, Account } from "@/shared/types";

export interface Debt {
  id: string;
  amount: number;
  description?: string;
  currency: Currency;
  dueDate?: string;
  isPaid: boolean;
  paidAmount: number;
  paidDate?: string;
  creditor: string;
  userId: string;
  accountId: string;
  account?: Account;
  createdAt: string;
}

