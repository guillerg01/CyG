import { Currency, Account, TransactionType } from "@/shared/types";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  description?: string;
  referenceId?: string;
  userId: string;
  accountId: string;
  account?: Account;
  createdAt: string;
}

export interface Change {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  authorId: string;
  author?: import("@/shared/types").User;
  createdAt: string;
}

