export type Currency = "USD" | "USDT";
export type PaymentMethod = "CASH" | "TRANSFER";
export type ExpenseType = "PLANNED" | "REALIZED";
export type TransactionType =
  | "EXPENSE"
  | "INCOME"
  | "LOAN"
  | "DEBT"
  | "CONVERSION"
  | "LOAN_PAYMENT"
  | "DEBT_PAYMENT";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  incomePercentage: number;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  balanceUSD: number;
  balanceUSDT: number;
  isShared: boolean;
  users?: UserAccount[];
  createdAt: string;
}

export interface UserAccount {
  id: string;
  userId: string;
  accountId: string;
  role: string;
  user?: User;
  account?: Account;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

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
  author?: User;
  createdAt: string;
}

export interface Statistics {
  totals: {
    expenses: { USD: number; USDT: number };
    incomes: { USD: number; USDT: number };
    balance: { USD: number; USDT: number };
  };
  byPaymentMethod: {
    cash: number;
    transfer: number;
  };
  byCategory: Record<string, { USD: number; USDT: number }>;
  monthly: {
    expenses: Record<string, { USD: number; USDT: number }>;
    incomes: Record<string, { USD: number; USDT: number }>;
  };
}
