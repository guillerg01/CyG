"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { ExpenseForm, ExpenseFormData } from "@/features/expenses";
import { Account, Category } from "@/shared/types";
import { Statistics } from "@/features/statistics";
import {
  IconCurrencyDollar,
  IconPlus,
  IconArrowDown,
  IconWallet,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import { formatCurrency, getMonthRange } from "@/shared/utils";
import { useRouter } from "next/navigation";

interface FrequentExpense {
  category: { id: string; name: string; color: string };
  currency: string;
  paymentMethod: string;
  amount: number;
  description: string | null;
  count: number;
  lastUsed: string;
}

export default function QuickPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [frequentExpenses, setFrequentExpenses] = useState<FrequentExpense[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quickExpenseData, setQuickExpenseData] = useState<Partial<ExpenseFormData> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { start, end } = getMonthRange(new Date());
      const params = new URLSearchParams();
      params.set("startDate", start.toISOString().split("T")[0]);
      params.set("endDate", end.toISOString().split("T")[0]);

      const [accountsRes, categoriesRes, statsRes, frequentRes] =
        await Promise.all([
          fetch("/api/accounts"),
          fetch("/api/categories"),
          fetch(`/api/statistics?${params.toString()}`),
          fetch("/api/expenses/frequent?limit=6"),
        ]);

      if (accountsRes.ok) {
        setAccounts(await accountsRes.json());
      }
      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json());
      }
      if (statsRes.ok) {
        setStatistics(await statsRes.json());
      }
      if (frequentRes.ok) {
        setFrequentExpenses(await frequentRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExpenseSubmit = async (data: ExpenseFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setModalOpen(false);
        setQuickExpenseData(null);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickExpense = (frequent: FrequentExpense) => {
    const defaultAccount = accounts.find((a) => !a.isShared) || accounts[0];
    setQuickExpenseData({
      amount: frequent.amount,
      description: frequent.description || "",
      currency: frequent.currency as any,
      paymentMethod: frequent.paymentMethod as any,
      expenseType: "REALIZED",
      isShared: false,
      accountId: defaultAccount?.id || "",
      categoryId: frequent.category.id,
    });
    setModalOpen(true);
  };

  const handleNewExpense = () => {
    const defaultAccount = accounts.find((a) => !a.isShared) || accounts[0];
    setQuickExpenseData({
      currency: "USD_ZELLE",
      paymentMethod: "TRANSFER",
      expenseType: "REALIZED",
      isShared: false,
      accountId: defaultAccount?.id || "",
      categoryId: categories[0]?.id || "",
    });
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const availableBalance = statistics?.totals.balance?.USD || 0;
  const plannedExpenses = statistics?.totals.plannedExpenses?.USD || 0;
  const afterPlanned = availableBalance - plannedExpenses;

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Acceso Rápido</h1>
          <Button
            size="sm"
            variant="flat"
            onPress={() => router.push("/dashboard")}
            className="bg-zinc-800 hover:bg-zinc-700 text-white"
            startContent={<IconLayoutDashboard className="w-4 h-4" />}
          >
            Dashboard Completo
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <Card className="bg-gradient-to-br from-emerald-600 to-emerald-500 border-0">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Disponible Actualmente</p>
                  <p className="text-white text-2xl font-bold mt-1">
                    ${availableBalance.toFixed(2)}
                  </p>
                </div>
                <IconWallet className="w-8 h-8 text-emerald-100" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-blue-600 to-blue-500 border-0">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">
                    Después de Gastos Planeados
                  </p>
                  <p className="text-white text-2xl font-bold mt-1">
                    ${afterPlanned.toFixed(2)}
                  </p>
                  <p className="text-blue-100 text-xs mt-1">
                    Planeados: ${plannedExpenses.toFixed(2)}
                  </p>
                </div>
                <IconCurrencyDollar className="w-8 h-8 text-blue-100" />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="pt-2 space-y-3">
          <Button
            className="w-full bg-rose-600 hover:bg-rose-700 h-14 text-lg font-semibold"
            onPress={handleNewExpense}
            startContent={<IconPlus className="w-6 h-6" />}
          >
            Nuevo Gasto
          </Button>
          <Button
            className="w-full bg-zinc-800 hover:bg-zinc-700 h-12 text-base font-medium"
            onPress={() => router.push("/dashboard")}
            startContent={<IconLayoutDashboard className="w-5 h-5" />}
            variant="flat"
          >
            Ver Dashboard Completo
          </Button>
        </div>

        {frequentExpenses.length > 0 && (
          <div className="pt-2">
            <h2 className="text-lg font-semibold text-white mb-3">
              Gastos Frecuentes
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {frequentExpenses.map((frequent, idx) => (
                <Button
                  key={idx}
                  className="bg-zinc-800 hover:bg-zinc-700 h-auto py-4 flex flex-col items-center justify-center gap-2"
                  onPress={() => handleQuickExpense(frequent)}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: frequent.category.color + "40" }}
                  >
                    <IconArrowDown
                      className="w-5 h-5"
                      style={{ color: frequent.category.color }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-white text-xs font-medium">
                      {frequent.category.name}
                    </p>
                    <p className="text-emerald-400 text-sm font-bold">
                      {formatCurrency(frequent.amount, frequent.currency as any)}
                    </p>
                    {frequent.description && (
                      <p className="text-zinc-500 text-xs mt-1 truncate max-w-[100px]">
                        {frequent.description}
                      </p>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setQuickExpenseData(null);
        }}
        size="full"
        classNames={{
          base: "bg-zinc-900",
          header: "border-b border-zinc-800",
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">Nuevo Gasto</ModalHeader>
          <ModalBody className="pb-6">
            {accounts.length > 0 && categories.length > 0 && (
              <ExpenseForm
                accounts={accounts}
                categories={categories}
                onSubmit={handleExpenseSubmit}
                onCancel={() => {
                  setModalOpen(false);
                  setQuickExpenseData(null);
                }}
                initialData={quickExpenseData || undefined}
                loading={submitting}
                isEdit={false}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}

