import { Currency, Account, User } from "@/shared/types";

export interface Loan {
  id: string;
  amount: number;
  description?: string;
  currency: Currency;
  dueDate?: string;
  isPaid: boolean;
  paidAmount: number;
  paidDate?: string;
  giverId: string;
  receiverId: string;
  fromAccountId: string;
  toAccountId: string;
  giver?: User;
  receiver?: User;
  fromAccount?: Account;
  toAccount?: Account;
  createdAt: string;
}

