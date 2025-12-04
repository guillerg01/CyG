export type Currency =
  | "USD_ZELLE"
  | "USD_EFECTIVO"
  | "USDT"
  | "CUP_EFECTIVO"
  | "CUP_TRANSFERENCIA";

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
  balanceUSDZelle: number;
  balanceUSDEfectivo: number;
  balanceUSDT: number;
  balanceCUPEfectivo: number;
  balanceCUPTransferencia: number;
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

export interface IconSvgProps extends React.SVGProps<SVGSVGElement> {
  size?: string | number;
  width?: string | number;
  height?: string | number;
  color?: string;
}
