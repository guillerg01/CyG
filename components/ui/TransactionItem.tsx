"use client";

import { Currency, PaymentMethod, TransactionType } from "@/types";
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";

interface TransactionItemProps {
  type: TransactionType | "EXPENSE" | "INCOME";
  amount: number;
  currency: Currency;
  description?: string;
  category?: string;
  paymentMethod?: PaymentMethod;
  date: string;
  onClick?: () => void;
}

const typeConfig = {
  EXPENSE: { label: "Gasto", color: "text-rose-400", sign: "-" },
  INCOME: { label: "Ingreso", color: "text-emerald-400", sign: "+" },
  LOAN: { label: "Prestamo", color: "text-blue-400", sign: "-" },
  DEBT: { label: "Deuda", color: "text-amber-400", sign: "-" },
  CONVERSION: { label: "Conversion", color: "text-purple-400", sign: "" },
  LOAN_PAYMENT: { label: "Pago Prestamo", color: "text-blue-400", sign: "+" },
  DEBT_PAYMENT: { label: "Pago Deuda", color: "text-amber-400", sign: "-" },
};

export function TransactionItem({
  type,
  amount,
  currency,
  description,
  category,
  paymentMethod,
  date,
  onClick,
}: TransactionItemProps) {
  const config = typeConfig[type];
  const formattedDate = new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${type === "EXPENSE" || type === "DEBT" ? "bg-rose-500/20" : "bg-emerald-500/20"}`}
        >
          <span className={config.color}>
            {type === "EXPENSE" || type === "DEBT" ? (
              <IconArrowDown className="w-5 h-5" />
            ) : (
              <IconArrowUp className="w-5 h-5" />
            )}
          </span>
        </div>
        <div>
          <p className="text-white font-medium text-sm">
            {description || config.label}
          </p>
          <div className="flex items-center gap-2">
            {category && (
              <span className="text-zinc-500 text-xs">{category}</span>
            )}
            {paymentMethod && (
              <span className="text-zinc-600 text-xs">
                {paymentMethod === "CASH" ? "Efectivo" : "Transferencia"}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${config.color}`}>
          {config.sign}
          {currency === "USD" ? "$" : ""}
          {amount.toFixed(2)} {currency === "USDT" ? "USDT" : ""}
        </p>
        <p className="text-zinc-500 text-xs">{formattedDate}</p>
      </div>
    </div>
  );
}

