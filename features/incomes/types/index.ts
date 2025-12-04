import { Currency, Account } from "@/shared/types";

export interface Income {
  id: string;
  amount: number;
  description?: string;
  currency: Currency;
  userId: string;
  accountId: string;
  account?: Account;
  createdAt: string;
}

export interface IncomeFormData {
  amount: number;
  description?: string;
  currency: Currency;
  accountId: string;
  createdAt?: string;
  convertToCUP?: boolean;
  exchangeRate?: number;
}
