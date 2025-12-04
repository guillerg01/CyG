"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { StatCard, TransactionItem, DateViewToggle } from "@/shared/components";
import { ExpenseForm, ExpenseFormData, Expense } from "@/features/expenses";
import { IncomeForm, IncomeFormData, Income } from "@/features/incomes";
import { ConversionForm, ConversionFormData } from "@/features/conversions";
import { Account, Category } from "@/shared/types";
import { Statistics } from "@/features/statistics";
import {
  IconCurrencyDollar,
  IconCoins,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import { formatCurrency, getMonthRange } from "@/shared/utils";

type ModalType = "expense" | "income" | "conversion" | null;

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [recentIncomes, setRecentIncomes] = useState<Income[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [modalOpen, setModalOpen] = useState<ModalType>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCurrentMonth, setIsCurrentMonth] = useState(true); // Por defecto mes actual

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      // Si está en modo "mes actual", agregar filtros de fecha
      if (isCurrentMonth) {
        const { start, end } = getMonthRange(new Date());
        params.set("startDate", start.toISOString().split("T")[0]);
        params.set("endDate", end.toISOString().split("T")[0]);
      }

      const [accountsRes, categoriesRes, expensesRes, incomesRes, statsRes] =
        await Promise.all([
          fetch("/api/accounts"),
          fetch("/api/categories"),
          fetch(
            `/api/expenses?limit=5${params.toString() ? `&${params.toString()}` : ""}`
          ),
          fetch(
            `/api/incomes?limit=5${params.toString() ? `&${params.toString()}` : ""}`
          ),
          fetch(
            `/api/statistics${params.toString() ? `?${params.toString()}` : ""}`
          ),
        ]);

      if (accountsRes.ok) {
        setAccounts(await accountsRes.json());
      }
      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json());
      }
      if (expensesRes.ok) {
        setRecentExpenses(await expensesRes.json());
      }
      if (incomesRes.ok) {
        setRecentIncomes(await incomesRes.json());
      }
      if (statsRes.ok) {
        setStatistics(await statsRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isCurrentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData, isCurrentMonth]);

  const handleExpenseSubmit = async (data: ExpenseFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setModalOpen(null);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleIncomeSubmit = async (data: IncomeFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/incomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setModalOpen(null);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConversionSubmit = async (data: ConversionFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/conversions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setModalOpen(null);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalBalanceUSD = accounts.reduce(
    (sum, a) => sum + a.balanceUSDZelle + a.balanceUSDEfectivo,
    0
  );
  const totalBalanceUSDT = accounts.reduce((sum, a) => sum + a.balanceUSDT, 0);
  const totalBalanceCUP = accounts.reduce(
    (sum, a) => sum + a.balanceCUPEfectivo + a.balanceCUPTransferencia,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400 text-sm">
            Resumen de tu situacion financiera
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-rose-600 hover:bg-rose-700"
            onPress={() => setModalOpen("expense")}
          >
            + Gasto
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onPress={() => setModalOpen("income")}
          >
            + Ingreso
          </Button>
          <Button
            variant="flat"
            className="border border-purple-500/50 text-purple-400"
            onPress={() => setModalOpen("conversion")}
          >
            Convertir
          </Button>
        </div>
      </div>

      <DateViewToggle
        isCurrentMonth={isCurrentMonth}
        onToggle={setIsCurrentMonth}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Balance USD"
          value={`$${totalBalanceUSD.toFixed(2)}`}
          variant={totalBalanceUSD >= 0 ? "success" : "danger"}
          icon={<IconCurrencyDollar className="w-6 h-6 text-emerald-400" />}
        />
        <StatCard
          title="Balance USDT"
          value={`${totalBalanceUSDT.toFixed(2)} USDT`}
          variant={totalBalanceUSDT >= 0 ? "success" : "danger"}
          icon={<IconCoins className="w-6 h-6 text-blue-400" />}
        />
        <StatCard
          title="Balance CUP"
          value={`${totalBalanceCUP.toFixed(2)} CUP`}
          variant={totalBalanceCUP >= 0 ? "success" : "danger"}
          icon={<IconCurrencyDollar className="w-6 h-6 text-amber-400" />}
        />
        <StatCard
          title="Gastos del Mes"
          value={`$${(statistics?.totals.expenses.USD || 0).toFixed(2)}`}
          subtitle={`${(statistics?.totals.expenses.USDT || 0).toFixed(2)} USDT / ${(statistics?.totals.expenses.CUP || 0).toFixed(2)} CUP`}
          variant="warning"
          icon={<IconTrendingDown className="w-6 h-6 text-amber-400" />}
        />
        <StatCard
          title="Ingresos del Mes"
          value={`$${(statistics?.totals.incomes.USD || 0).toFixed(2)}`}
          subtitle={`${(statistics?.totals.incomes.USDT || 0).toFixed(2)} USDT / ${(statistics?.totals.incomes.CUP || 0).toFixed(2)} CUP`}
          variant="success"
          icon={<IconTrendingUp className="w-6 h-6 text-emerald-400" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardHeader className="flex justify-between items-center pb-2">
            <h2 className="text-lg font-semibold text-white">Ultimos Gastos</h2>
            <Button
              variant="light"
              size="sm"
              className="text-emerald-400"
              as="a"
              href="/dashboard/expenses"
            >
              Ver todos
            </Button>
          </CardHeader>
          <CardBody className="space-y-2">
            {recentExpenses.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">
                No hay gastos registrados
              </p>
            ) : (
              recentExpenses.map((expense) => (
                <TransactionItem
                  key={expense.id}
                  type="EXPENSE"
                  amount={expense.amount}
                  currency={expense.currency}
                  description={expense.description}
                  category={expense.category?.name}
                  paymentMethod={expense.paymentMethod}
                  date={expense.createdAt}
                />
              ))
            )}
          </CardBody>
        </Card>

        <Card className="bg-zinc-900 border border-zinc-800">
          <CardHeader className="flex justify-between items-center pb-2">
            <h2 className="text-lg font-semibold text-white">
              Ultimos Ingresos
            </h2>
            <Button
              variant="light"
              size="sm"
              className="text-emerald-400"
              as="a"
              href="/dashboard/incomes"
            >
              Ver todos
            </Button>
          </CardHeader>
          <CardBody className="space-y-2">
            {recentIncomes.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">
                No hay ingresos registrados
              </p>
            ) : (
              recentIncomes.map((income) => (
                <TransactionItem
                  key={income.id}
                  type="INCOME"
                  amount={income.amount}
                  currency={income.currency}
                  description={income.description}
                  date={income.createdAt}
                />
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 border border-zinc-800 lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">
              Gastos por Categoria
            </h2>
          </CardHeader>
          <CardBody>
            {statistics?.byCategory &&
            Object.keys(statistics.byCategory).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(statistics.byCategory).map(
                  ([category, amounts]) => {
                    const total = amounts.USD + amounts.USDT + amounts.CUP;
                    const maxTotal = Math.max(
                      ...Object.values(statistics.byCategory).map(
                        (a) => a.USD + a.USDT + a.CUP
                      )
                    );
                    const percentage = (total / maxTotal) * 100;

                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-300">{category}</span>
                          <span className="text-zinc-400 text-xs">
                            ${amounts.USD.toFixed(2)} /{" "}
                            {amounts.USDT.toFixed(2)} / {amounts.CUP.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                            style={{
                              width: `${(amounts.USD / maxTotal) * 100}%`,
                            }}
                          />
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                            style={{
                              width: `${(amounts.USDT / maxTotal) * 100}%`,
                            }}
                          />
                          <div
                            className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                            style={{
                              width: `${(amounts.CUP / maxTotal) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-8">
                No hay datos de categorias
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="bg-zinc-900 border border-zinc-800">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Cuentas</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {accounts.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">No hay cuentas</p>
            ) : (
              accounts.map((account) => (
                <div
                  key={account.id}
                  className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">
                      {account.name}
                    </span>
                    {account.isShared && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                        Compartida
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">USD Zelle:</span>
                      <span className="text-emerald-400">
                        ${account.balanceUSDZelle.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">USD Efectivo:</span>
                      <span className="text-emerald-400">
                        ${account.balanceUSDEfectivo.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">USDT:</span>
                      <span className="text-blue-400">
                        {account.balanceUSDT.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">CUP Efectivo:</span>
                      <span className="text-amber-400">
                        {account.balanceCUPEfectivo.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">CUP Transferencia:</span>
                      <span className="text-amber-400">
                        {account.balanceCUPTransferencia.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={modalOpen !== null}
        onClose={() => setModalOpen(null)}
        size="lg"
        classNames={{
          base: "bg-zinc-900 border border-zinc-800",
          header: "border-b border-zinc-800",
        }}
      >
        <ModalContent>
          <ModalHeader>
            {modalOpen === "expense" && "Agregar Gasto"}
            {modalOpen === "income" && "Agregar Ingreso"}
            {modalOpen === "conversion" && "Convertir Moneda"}
          </ModalHeader>
          <ModalBody className="pb-6">
            {modalOpen === "expense" && (
              <ExpenseForm
                accounts={accounts}
                categories={categories}
                onSubmit={handleExpenseSubmit}
                onCancel={() => setModalOpen(null)}
                loading={submitting}
              />
            )}
            {modalOpen === "income" && (
              <IncomeForm
                accounts={accounts}
                onSubmit={handleIncomeSubmit}
                onCancel={() => setModalOpen(null)}
                loading={submitting}
              />
            )}
            {modalOpen === "conversion" && (
              <ConversionForm
                accounts={accounts}
                onSubmit={handleConversionSubmit}
                onCancel={() => setModalOpen(null)}
                loading={submitting}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
