"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Account, Currency } from "@/shared/types";
import { formatCurrency } from "@/shared/utils";
import { TransferFormData } from "../types";

interface TransferFormProps {
  accounts: Account[];
  onSubmit: (data: TransferFormData) => Promise<void>;
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

export function TransferForm({
  accounts,
  onSubmit,
  onCancel,
  loading,
}: TransferFormProps) {
  const [formData, setFormData] = useState<TransferFormData>({
    amount: 0,
    description: "",
    currency: "USD_ZELLE",
    fromAccountId: "",
    toAccountId: "",
  });

  useEffect(() => {
    if (accounts.length > 0) {
      const personalAccount = accounts.find((a) => !a.isShared);
      setFormData((prev) => ({
        ...prev,
        fromAccountId: personalAccount?.id || accounts[0].id,
      }));
    }
  }, [accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const fromAccount = accounts.find((a) => a.id === formData.fromAccountId);
  const toAccount = accounts.find((a) => a.id === formData.toAccountId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Cuenta Origen"
          selectedKeys={formData.fromAccountId ? [formData.fromAccountId] : []}
          onChange={(e) =>
            setFormData({ ...formData, fromAccountId: e.target.value })
          }
          classNames={{
            trigger: "bg-zinc-800 border-zinc-700",
          }}
        >
          {accounts.map((a) => (
            <SelectItem key={a.id}>{a.name}</SelectItem>
          ))}
        </Select>

        <Select
          label="Cuenta Destino"
          selectedKeys={formData.toAccountId ? [formData.toAccountId] : []}
          onChange={(e) =>
            setFormData({ ...formData, toAccountId: e.target.value })
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

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Monto"
          type="number"
          step="0.01"
          value={formData.amount.toString()}
          onChange={(e) =>
            setFormData({
              ...formData,
              amount: parseFloat(e.target.value) || 0,
            })
          }
          isRequired
          classNames={{
            input: "bg-zinc-800",
            inputWrapper: "bg-zinc-800 border-zinc-700",
          }}
        />

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
      </div>

      <Input
        label="Descripcion (opcional)"
        value={formData.description || ""}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        classNames={{
          input: "bg-zinc-800",
          inputWrapper: "bg-zinc-800 border-zinc-700",
        }}
      />

      {fromAccount && toAccount && formData.amount > 0 && (
        <div className="p-4 bg-zinc-800 rounded-lg">
          <p className="text-zinc-400 text-sm mb-2">Resumen de Transferencia</p>
          <p className="text-white text-sm">
            De: <span className="font-semibold">{fromAccount.name}</span>
          </p>
          <p className="text-white text-sm">
            A: <span className="font-semibold">{toAccount.name}</span>
          </p>
          <p className="text-emerald-400 text-lg font-bold mt-2">
            {formatCurrency(formData.amount, formData.currency)}
          </p>
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
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          isLoading={loading}
        >
          Transferir
        </Button>
      </div>
    </form>
  );
}

