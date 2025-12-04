import { Currency, Account } from "@/shared/types";

export interface Transfer {
  id: string;
  amount: number;
  description: string | null;
  currency: Currency;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  fromAccount?: Account;
  toAccount?: Account;
  createdAt: string;
}

export interface TransferFormData {
  amount: number;
  description?: string;
  currency: Currency;
  fromAccountId: string;
  toAccountId: string;
}

