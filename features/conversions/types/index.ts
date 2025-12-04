import { Currency, Account } from "@/shared/types";

export interface Conversion {
  id: string;
  fromAmount: number;
  toAmount: number;
  fromCurrency: Currency;
  toCurrency: Currency;
  exchangeRate: number;
  userId: string;
  accountId: string;
  account?: Account;
  createdAt: string;
}

export interface ConversionFormData {
  fromAmount: number;
  fromCurrency: Currency;
  toCurrency: Currency;
  exchangeRate: number;
  fromAccountId: string;
  toAccountId?: string;
}

