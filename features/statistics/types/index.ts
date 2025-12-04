export interface Statistics {
  totals: {
    expenses: { USD: number; USDT: number; CUP: number };
    incomes: { USD: number; USDT: number; CUP: number };
    balance: { USD: number; USDT: number; CUP: number };
  };
  byPaymentMethod: {
    cash: number;
    transfer: number;
  };
  byCategory: Record<string, { USD: number; USDT: number; CUP: number }>;
  monthly: {
    expenses: Record<string, { USD: number; USDT: number; CUP: number }>;
    incomes: Record<string, { USD: number; USDT: number; CUP: number }>;
  };
}

