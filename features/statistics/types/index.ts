export interface Statistics {
  totals: {
    expenses: { USD: number; USDT: number; CUP: number };
    plannedExpenses: { USD: number; USDT: number; CUP: number };
    incomes: { USD: number; USDT: number; CUP: number };
    balance: { USD: number; USDT: number; CUP: number };
    availableBalance: { USD: number; USDT: number; CUP: number };
    sharedExpenses: { USD: number; USDT: number; CUP: number };
    personalExpenses: { USD: number; USDT: number; CUP: number };
    houseExpenses: { USD: number; USDT: number; CUP: number };
    houseAccountIncomes: { USD: number; USDT: number; CUP: number };
    houseAccountExpenses: { USD: number; USDT: number; CUP: number };
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

