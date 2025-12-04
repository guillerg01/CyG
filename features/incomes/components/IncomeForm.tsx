"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Account, Currency } from "@/shared/types";
import { IncomeFormData } from "../types";

interface IncomeFormProps {
  accounts: Account[];
  onSubmit: (data: IncomeFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<IncomeFormData>;
  loading?: boolean;
}

const currencies: { key: Currency; label: string }[] = [
  { key: "USD_ZELLE", label: "USD Zelle" },
  { key: "USD_EFECTIVO", label: "USD Efectivo" },
  { key: "USDT", label: "USDT" },
  { key: "CUP_EFECTIVO", label: "CUP Efectivo" },
  { key: "CUP_TRANSFERENCIA", label: "CUP Transferencia" },
];

export function IncomeForm({
  accounts,
  onSubmit,
  onCancel,
  initialData,
  loading,
}: IncomeFormProps) {
  const [formData, setFormData] = useState<IncomeFormData>({
    amount: initialData?.amount || 0,
    description: initialData?.description || "",
    currency: initialData?.currency || "USD_ZELLE",
    accountId: initialData?.accountId || "",
    createdAt: initialData?.createdAt || "",
    convertToCUP: initialData?.convertToCUP || false,
    exchangeRate: initialData?.exchangeRate || 450,
  });

  const selectedAccount = accounts.find((a) => a.id === formData.accountId);
  const isSharedAccount = selectedAccount?.isShared || false;
  const isUSDCurrency = formData.currency === "USD_ZELLE" || formData.currency === "USD_EFECTIVO";
  const showConversionOptions = isSharedAccount && isUSDCurrency;

  useEffect(() => {
    if (accounts.length > 0 && !formData.accountId) {
      setFormData((prev) => ({ ...prev, accountId: accounts[0].id }));
    }
  }, [accounts, formData.accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Monto"
        type="number"
        step="0.01"
        value={formData.amount.toString()}
        onChange={(e) =>
          setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
        }
        isRequired
        classNames={{
          input: "bg-zinc-800",
          inputWrapper: "bg-zinc-800 border-zinc-700",
        }}
      />

      <Input
        label="Descripcion"
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        classNames={{
          input: "bg-zinc-800",
          inputWrapper: "bg-zinc-800 border-zinc-700",
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Moneda"
          selectedKeys={[formData.currency]}
          onChange={(e) =>
            setFormData({ ...formData, currency: e.target.value as Currency })
          }
          classNames={{
            trigger: "bg-zinc-800 border-zinc-700",
          }}
        >
          {currencies.map((c) => (
            <SelectItem key={c.key}>{c.label}</SelectItem>
          ))}
        </Select>

        <Select
          label="Cuenta"
          selectedKeys={formData.accountId ? [formData.accountId] : []}
          onChange={(e) =>
            setFormData({ ...formData, accountId: e.target.value })
          }
          classNames={{
            trigger: "bg-zinc-800 border-zinc-700",
          }}
        >
          {accounts.map((a) => (
            <SelectItem key={a.id}>{a.name}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-zinc-400">
          Fecha del Ingreso
        </label>
        <Input
          type="datetime-local"
          value={formData.createdAt}
          onChange={(e) =>
            setFormData({ ...formData, createdAt: e.target.value })
          }
          placeholder="Dejar vacío para fecha actual"
          classNames={{
            input: "bg-zinc-800 text-white",
            inputWrapper: "bg-zinc-800 border-zinc-700 hover:border-zinc-600",
            base: "w-full",
          }}
        />
        <p className="text-xs text-zinc-500">
          Si no especificas una fecha, se usará la fecha y hora actual
        </p>
      </div>

      {showConversionOptions && (
        <div className="space-y-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="convertToCUP"
              checked={formData.convertToCUP || false}
              onChange={(e) =>
                setFormData({ ...formData, convertToCUP: e.target.checked })
              }
              className="w-4 h-4 rounded bg-zinc-700 border-zinc-600 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="convertToCUP" className="text-sm text-zinc-300">
              Convertir a CUP y devolver préstamos automáticamente
            </label>
          </div>
          {formData.convertToCUP && (
            <Input
              label="Tasa de Cambio (USD a CUP)"
              type="number"
              step="0.01"
              value={formData.exchangeRate?.toString() || "450"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  exchangeRate: parseFloat(e.target.value) || 450,
                })
              }
              description={`${formData.amount} USD × ${formData.exchangeRate || 450} = ${((formData.amount || 0) * (formData.exchangeRate || 450)).toFixed(2)} CUP`}
              classNames={{
                input: "bg-zinc-800",
                inputWrapper: "bg-zinc-800 border-zinc-700",
              }}
            />
          )}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="flat"
          className="flex-1"
          onPress={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          color="primary"
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          isLoading={loading}
        >
          {initialData ? "Actualizar" : "Agregar"} Ingreso
        </Button>
      </div>
    </form>
  );
}

