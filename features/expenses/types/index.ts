import { Currency, PaymentMethod, ExpenseType, Category, Account } from "@/shared/types";

export interface Expense {
  id: string;
  amount: number;
  description?: string;
  currency: Currency;
  paymentMethod: PaymentMethod;
  expenseType: ExpenseType;
  isShared: boolean;
  plannedDate?: string;
  userId: string;
  accountId: string;
  categoryId: string;
  category?: Category;
  account?: Account;
  createdAt: string;
}

export interface ExpenseFormData {
  amount: number;
  description: string;
  currency: Currency;
  paymentMethod: PaymentMethod;
  expenseType: ExpenseType;
  isShared: boolean;
  plannedDate?: string;
  accountId: string;
  categoryId: string;
  createdAt?: string;
}

