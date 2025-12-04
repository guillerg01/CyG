"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Account, Currency } from "@/shared/types";
import { formatCurrency } from "@/shared/utils";
import { ConversionFormData } from "../types";

interface ConversionFormProps {
  accounts: Account[];
  onSubmit: (data: ConversionFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const currencies: { key: Currency; label: string }[] = [
  { key: "USD_ZELLE", label: "USD Zelle" },
  { key: "USD_EFECTIVO", label: "USD Efectivo" },
  { key: "USDT", label: "USDT" },
  { key: "CUP_EFECTIVO", label: "CUP Efectivo" },
  { key: "CUP_TRANSFERENCIA", label: "CUP Transferencia" },
];

export function ConversionForm({
  accounts,
  onSubmit,
  onCancel,
  loading,
}: ConversionFormProps) {
  const [formData, setFormData] = useState<ConversionFormData>({
    fromAmount: 0,
    fromCurrency: "USD_ZELLE",
    toCurrency: "USDT",
    exchangeRate: 1,
    accountId: "",
  });

  const toAmount = formData.fromAmount * formData.exchangeRate;

  useEffect(() => {
    if (accounts.length > 0 && !formData.accountId) {
      setFormData((prev) => ({ ...prev, accountId: accounts[0].id }));
    }
  }, [accounts, formData.accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const swapCurrencies = () => {
    setFormData({
      ...formData,
      fromCurrency: formData.toCurrency,
      toCurrency: formData.fromCurrency,
      exchangeRate: 1 / formData.exchangeRate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          <SelectItem key={a.id}>
            {a.name} (USD Z: ${a.balanceUSDZelle.toFixed(2)} / USD E: $
            {a.balanceUSDEfectivo.toFixed(2)} / USDT: {a.balanceUSDT.toFixed(2)}{" "}
            / CUP E: {a.balanceCUPEfectivo.toFixed(2)} / CUP T:{" "}
            {a.balanceCUPTransferencia.toFixed(2)})
          </SelectItem>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Monto a Convertir"
          type="number"
          step="0.01"
          value={formData.fromAmount.toString()}
          onChange={(e) =>
            setFormData({
              ...formData,
              fromAmount: parseFloat(e.target.value) || 0,
            })
          }
          isRequired
          classNames={{
            input: "bg-zinc-800",
            inputWrapper: "bg-zinc-800 border-zinc-700",
          }}
        />

        <Select
          label="De"
          selectedKeys={[formData.fromCurrency]}
          onChange={(e) =>
            setFormData({
              ...formData,
              fromCurrency: e.target.value as Currency,
            })
          }
          classNames={{
            trigger: "bg-zinc-800 border-zinc-700",
          }}
        >
          {currencies.map((c) => (
            <SelectItem key={c.key}>{c.label}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="flat"
          size="sm"
          onPress={swapCurrencies}
          className="px-6"
        >
          Intercambiar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Tasa de Cambio"
          type="number"
          step="0.0001"
          value={formData.exchangeRate.toString()}
          onChange={(e) =>
            setFormData({
              ...formData,
              exchangeRate: parseFloat(e.target.value) || 1,
            })
          }
          isRequired
          classNames={{
            input: "bg-zinc-800",
            inputWrapper: "bg-zinc-800 border-zinc-700",
          }}
        />

        <Select
          label="A"
          selectedKeys={[formData.toCurrency]}
          onChange={(e) =>
            setFormData({ ...formData, toCurrency: e.target.value as Currency })
          }
          classNames={{
            trigger: "bg-zinc-800 border-zinc-700",
          }}
        >
          {currencies.map((c) => (
            <SelectItem key={c.key}>{c.label}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="p-4 bg-zinc-800 rounded-lg text-center">
        <p className="text-zinc-400 text-sm">Recibiras</p>
        <p className="text-2xl font-bold text-emerald-400">
          {formatCurrency(toAmount, formData.toCurrency)}
        </p>
      </div>

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
          className="flex-1 bg-purple-600 hover:bg-purple-700"
          isLoading={loading}
        >
          Convertir
        </Button>
      </div>
    </form>
  );
}
