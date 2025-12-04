"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Category, Account, Currency, PaymentMethod, ExpenseType } from "@/shared/types";
import { ExpenseFormData } from "../types";

interface ExpenseFormProps {
  accounts: Account[];
  categories: Category[];
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<ExpenseFormData>;
  loading?: boolean;
  isEdit?: boolean;
}

const currencies: { key: Currency; label: string }[] = [
  { key: "USD_ZELLE", label: "USD Zelle" },
  { key: "USD_EFECTIVO", label: "USD Efectivo" },
  { key: "USDT", label: "USDT" },
  { key: "CUP_EFECTIVO", label: "CUP Efectivo" },
  { key: "CUP_TRANSFERENCIA", label: "CUP Transferencia" },
];

const paymentMethods: { key: PaymentMethod; label: string }[] = [
  { key: "CASH", label: "Efectivo" },
  { key: "TRANSFER", label: "Transferencia" },
];

const expenseTypes: { key: ExpenseType; label: string }[] = [
  { key: "REALIZED", label: "Realizado" },
  { key: "PLANNED", label: "Planeado" },
];

export function ExpenseForm({
  accounts,
  categories,
  onSubmit,
  onCancel,
  initialData,
  loading,
  isEdit = false,
}: ExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: initialData?.amount || 0,
    description: initialData?.description || "",
    currency: initialData?.currency || "USD_ZELLE",
    paymentMethod: initialData?.paymentMethod || "CASH",
    expenseType: initialData?.expenseType || "REALIZED",
    isShared: initialData?.isShared || false,
    plannedDate: initialData?.plannedDate || "",
    accountId: initialData?.accountId || "",
    categoryId: initialData?.categoryId || "",
    createdAt: initialData?.createdAt || "",
  });

  useEffect(() => {
    if (accounts.length > 0 && !formData.accountId) {
      setFormData((prev) => ({ ...prev, accountId: accounts[0].id }));
    }
    if (categories.length > 0 && !formData.categoryId) {
      setFormData((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [accounts, categories, formData.accountId, formData.categoryId]);

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
        label="Descripcion (opcional)"
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
          label="Metodo de Pago"
          selectedKeys={[formData.paymentMethod]}
          onChange={(e) =>
            setFormData({
              ...formData,
              paymentMethod: e.target.value as PaymentMethod,
            })
          }
          classNames={{
            trigger: "bg-zinc-800 border-zinc-700",
          }}
        >
          {paymentMethods.map((m) => (
            <SelectItem key={m.key}>{m.label}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
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

        <Select
          label="Categoria"
          selectedKeys={formData.categoryId ? [formData.categoryId] : []}
          onChange={(e) =>
            setFormData({ ...formData, categoryId: e.target.value })
          }
          classNames={{
            trigger: "bg-zinc-800 border-zinc-700",
          }}
        >
          {categories.map((c) => (
            <SelectItem key={c.id}>{c.name}</SelectItem>
          ))}
        </Select>
      </div>

      <Select
        label="Tipo de Gasto"
        selectedKeys={[formData.expenseType]}
        onChange={(e) =>
          setFormData({
            ...formData,
            expenseType: e.target.value as ExpenseType,
          })
        }
        classNames={{
          trigger: "bg-zinc-800 border-zinc-700",
        }}
      >
        {expenseTypes.map((t) => (
          <SelectItem key={t.key}>{t.label}</SelectItem>
        ))}
      </Select>

      {formData.expenseType === "PLANNED" && (
        <Input
          label="Fecha Planeada"
          type="datetime-local"
          value={formData.plannedDate}
          onChange={(e) =>
            setFormData({ ...formData, plannedDate: e.target.value })
          }
          classNames={{
            input: "bg-zinc-800",
            inputWrapper: "bg-zinc-800 border-zinc-700",
          }}
        />
      )}

      <div className="space-y-2">
        <label className="text-sm text-zinc-400">
          Fecha del Gasto
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

      <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
        <span className="text-sm text-zinc-300">Gasto Compartido</span>
        <Switch
          isSelected={formData.isShared}
          onValueChange={(checked) =>
            setFormData({ ...formData, isShared: checked })
          }
        />
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
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          isLoading={loading}
        >
          {isEdit ? "Actualizar" : "Agregar"} Gasto
        </Button>
      </div>
    </form>
  );
}

