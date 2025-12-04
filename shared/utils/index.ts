import type { Currency } from "@/shared/types";

export function formatCurrency(amount: number, currency: Currency): string {
  const currencyMap: Record<Currency, string> = {
    USD_ZELLE: "$",
    USD_EFECTIVO: "$",
    USDT: "USDT ",
    CUP_EFECTIVO: "CUP ",
    CUP_TRANSFERENCIA: "CUP ",
  };
  const symbol = currencyMap[currency] || "";
  return `${symbol}${amount.toFixed(2)}`;
}

export function getCurrencyLabel(currency: Currency): string {
  const labels: Record<Currency, string> = {
    USD_ZELLE: "USD Zelle",
    USD_EFECTIVO: "USD Efectivo",
    USDT: "USDT",
    CUP_EFECTIVO: "CUP Efectivo",
    CUP_TRANSFERENCIA: "CUP Transferencia",
  };
  return labels[currency] || currency;
}

export function getBalanceField(currency: Currency): keyof {
  balanceUSDZelle: number;
  balanceUSDEfectivo: number;
  balanceUSDT: number;
  balanceCUPEfectivo: number;
  balanceCUPTransferencia: number;
} {
  const fieldMap: Record<Currency, keyof {
    balanceUSDZelle: number;
    balanceUSDEfectivo: number;
    balanceUSDT: number;
    balanceCUPEfectivo: number;
    balanceCUPTransferencia: number;
  }> = {
    USD_ZELLE: "balanceUSDZelle",
    USD_EFECTIVO: "balanceUSDEfectivo",
    USDT: "balanceUSDT",
    CUP_EFECTIVO: "balanceCUPEfectivo",
    CUP_TRANSFERENCIA: "balanceCUPTransferencia",
  };
  return fieldMap[currency];
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function calculateSharedExpense(
  totalAmount: number,
  userPercentage: number
): number {
  return (totalAmount * userPercentage) / 100;
}

export function convertCurrency(
  amount: number,
  exchangeRate: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  const isUSD = fromCurrency === "USD_ZELLE" || fromCurrency === "USD_EFECTIVO";
  const isUSDT = fromCurrency === "USDT";
  const isCUP = fromCurrency === "CUP_EFECTIVO" || fromCurrency === "CUP_TRANSFERENCIA";
  
  const toIsUSD = toCurrency === "USD_ZELLE" || toCurrency === "USD_EFECTIVO";
  const toIsUSDT = toCurrency === "USDT";
  const toIsCUP = toCurrency === "CUP_EFECTIVO" || toCurrency === "CUP_TRANSFERENCIA";
  
  if ((isUSD || isUSDT) && toIsCUP) {
    return amount * exchangeRate;
  }
  if (isCUP && (toIsUSD || toIsUSDT)) {
    return amount / exchangeRate;
  }
  if ((isUSD && toIsUSDT) || (isUSDT && toIsUSD)) {
    return amount * exchangeRate;
  }
  
  return amount * exchangeRate;
}

export function getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export function getYearRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear(), 11, 31, 23, 59, 59);
  return { start, end };
}

export function groupByMonth<T extends { createdAt: Date | string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      const date = new Date(item.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

export function groupByCategory<T extends { categoryId: string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      if (!acc[item.categoryId]) {
        acc[item.categoryId] = [];
      }
      acc[item.categoryId].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

