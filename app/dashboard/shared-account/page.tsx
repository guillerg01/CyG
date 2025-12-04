"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { IconBuilding, IconArrowDown, IconArrowUp, IconArrowsExchange, IconCurrencyDollar } from "@tabler/icons-react";
import { Account } from "@/shared/types";
import { formatCurrency, getCurrencyLabel } from "@/shared/utils";
import { DateViewToggle } from "@/shared/components";
import { getMonthRange } from "@/shared/utils";

interface SharedAccountData {
  account: Account | null;
  incomes: Array<{
    id: string;
    amount: number;
    description: string | null;
    currency: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  expenses: Array<{
    id: string;
    amount: number;
    description: string | null;
    currency: string;
    paymentMethod: string;
    expenseType: string;
    createdAt: string;
    category: {
      id: string;
      name: string;
      color: string | null;
    };
    account: {
      id: string;
      name: string;
    };
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  conversions: Array<{
    id: string;
    fromAmount: number;
    toAmount: number;
    fromCurrency: string;
    toCurrency: string;
    exchangeRate: number;
    description: string | null;
    createdAt: string;
    account: Account;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  transfers: Array<{
    id: string;
    amount: number;
    currency: string;
    description: string | null;
    createdAt: string;
    fromAccount: Account;
    toAccount: Account;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  loans: Array<{
    id: string;
    amount: number;
    currency: string;
    description: string | null;
    isPaid: boolean;
    paidAmount: number;
    createdAt: string;
    fromAccount: Account;
    toAccount: Account;
    giver: {
      id: string;
      name: string;
      email: string;
    };
    receiver: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export default function SharedAccountPage() {
  const [data, setData] = useState<SharedAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (isCurrentMonth) {
        const { start, end } = getMonthRange(new Date());
        params.set("startDate", start.toISOString().split("T")[0]);
        params.set("endDate", end.toISOString().split("T")[0]);
      }

      const response = await fetch(`/api/shared-account?${params.toString()}`);
      if (response.ok) {
        setData(await response.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isCurrentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!data || !data.account) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody>
            <p className="text-zinc-400">No se encontró la cuenta compartida.</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const totalIncomesUSD = data.incomes
    .filter((i) => i.currency === "USD_ZELLE" || i.currency === "USD_EFECTIVO")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalIncomesUSDT = data.incomes
    .filter((i) => i.currency === "USDT")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalIncomesCUP = data.incomes
    .filter((i) => i.currency === "CUP_EFECTIVO" || i.currency === "CUP_TRANSFERENCIA")
    .reduce((sum, i) => sum + i.amount, 0);

  const totalExpensesUSD = data.expenses
    .filter((e) => e.currency === "USD_ZELLE" || e.currency === "USD_EFECTIVO")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpensesUSDT = data.expenses
    .filter((e) => e.currency === "USDT")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpensesCUP = data.expenses
    .filter((e) => e.currency === "CUP_EFECTIVO" || e.currency === "CUP_TRANSFERENCIA")
    .reduce((sum, e) => sum + e.amount, 0);

  const balanceUSD = data.account.balanceUSDZelle + data.account.balanceUSDEfectivo;
  const balanceUSDT = data.account.balanceUSDT;
  const balanceCUP = data.account.balanceCUPEfectivo + data.account.balanceCUPTransferencia;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <IconBuilding className="w-6 h-6" />
            Cuenta Compartida Casa
          </h1>
          <p className="text-zinc-400 text-sm">
            Movimientos y resumen de la cuenta compartida
          </p>
        </div>
      </div>

      <DateViewToggle
        isCurrentMonth={isCurrentMonth}
        onToggle={setIsCurrentMonth}
      />

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
      >
        <Tab key="summary" title="Resumen">
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-emerald-900/30 border border-emerald-800/50">
                <CardBody>
                  <p className="text-emerald-300 text-sm mb-2">Total Ingresado</p>
                  <p className="text-white text-2xl font-bold">
                    {formatCurrency(totalIncomesUSD + totalIncomesUSDT + totalIncomesCUP / 450, "USD_ZELLE")}
                  </p>
                  <p className="text-zinc-400 text-xs mt-2">
                    USD: {formatCurrency(totalIncomesUSD, "USD_ZELLE")} | USDT: {totalIncomesUSDT.toFixed(2)} | CUP: {totalIncomesCUP.toFixed(2)}
                  </p>
                </CardBody>
              </Card>

              <Card className="bg-rose-900/30 border border-rose-800/50">
                <CardBody>
                  <p className="text-rose-300 text-sm mb-2">Total Gastado</p>
                  <p className="text-white text-2xl font-bold">
                    {formatCurrency(totalExpensesUSD + totalExpensesUSDT + totalExpensesCUP / 450, "USD_ZELLE")}
                  </p>
                  <p className="text-zinc-400 text-xs mt-2">
                    USD: {formatCurrency(totalExpensesUSD, "USD_ZELLE")} | USDT: {totalExpensesUSDT.toFixed(2)} | CUP: {totalExpensesCUP.toFixed(2)}
                  </p>
                </CardBody>
              </Card>

              <Card className="bg-blue-900/30 border border-blue-800/50">
                <CardBody>
                  <p className="text-blue-300 text-sm mb-2">Balance Actual</p>
                  <p className="text-white text-2xl font-bold">
                    {formatCurrency(balanceUSD + balanceUSDT + balanceCUP / 450, "USD_ZELLE")}
                  </p>
                  <p className="text-zinc-400 text-xs mt-2">
                    USD: {formatCurrency(balanceUSD, "USD_ZELLE")} | USDT: {balanceUSDT.toFixed(2)} | CUP: {balanceCUP.toFixed(2)}
                  </p>
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>

        <Tab key="incomes" title="Ingresos">
          <Card className="mt-4 bg-zinc-900 border border-zinc-800">
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Ingresos</h2>
            </CardHeader>
            <CardBody>
              {data.incomes.length === 0 ? (
                <p className="text-zinc-400 text-center py-8">No hay ingresos registrados</p>
              ) : (
                <Table aria-label="Ingresos">
                  <TableHeader>
                    <TableColumn>Fecha</TableColumn>
                    <TableColumn>Usuario</TableColumn>
                    <TableColumn>Descripción</TableColumn>
                    <TableColumn>Moneda</TableColumn>
                    <TableColumn>Monto</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {data.incomes.map((income) => (
                      <TableRow key={income.id}>
                        <TableCell>{new Date(income.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{income.user.name}</TableCell>
                        <TableCell>{income.description || "-"}</TableCell>
                        <TableCell>
                          <Chip size="sm" variant="flat">
                            {getCurrencyLabel(income.currency as any)}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-emerald-400">
                          {formatCurrency(income.amount, income.currency as any)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>

        <Tab key="expenses" title="Gastos">
          <Card className="mt-4 bg-zinc-900 border border-zinc-800">
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Gastos</h2>
            </CardHeader>
            <CardBody>
              {data.expenses.length === 0 ? (
                <p className="text-zinc-400 text-center py-8">No hay gastos registrados</p>
              ) : (
                <Table aria-label="Gastos">
                  <TableHeader>
                    <TableColumn>Fecha</TableColumn>
                    <TableColumn>Usuario</TableColumn>
                    <TableColumn>Cuenta</TableColumn>
                    <TableColumn>Categoría</TableColumn>
                    <TableColumn>Descripción</TableColumn>
                    <TableColumn>Moneda</TableColumn>
                    <TableColumn>Tipo</TableColumn>
                    <TableColumn>Monto</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {data.expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{expense.user.name}</TableCell>
                        <TableCell>{expense.account.name}</TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="flat"
                            style={{
                              backgroundColor: `${expense.category.color || "#6b7280"}20`,
                              color: expense.category.color || "#9ca3af",
                            }}
                          >
                            {expense.category.name}
                          </Chip>
                        </TableCell>
                        <TableCell>{expense.description || "-"}</TableCell>
                        <TableCell>
                          <Chip size="sm" variant="flat">
                            {getCurrencyLabel(expense.currency as any)}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="flat"
                            className={expense.expenseType === "REALIZED" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}
                          >
                            {expense.expenseType === "REALIZED" ? "Realizado" : "Planeado"}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-rose-400">
                          {formatCurrency(expense.amount, expense.currency as any)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>

        <Tab key="conversions" title="Conversiones">
          <Card className="mt-4 bg-zinc-900 border border-zinc-800">
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Conversiones</h2>
            </CardHeader>
            <CardBody>
              {data.conversions.length === 0 ? (
                <p className="text-zinc-400 text-center py-8">No hay conversiones registradas</p>
              ) : (
                <Table aria-label="Conversiones">
                  <TableHeader>
                    <TableColumn>Fecha</TableColumn>
                    <TableColumn>Usuario</TableColumn>
                    <TableColumn>Cuenta</TableColumn>
                    <TableColumn>Desde</TableColumn>
                    <TableColumn>Hacia</TableColumn>
                    <TableColumn>Tasa</TableColumn>
                    <TableColumn>Descripción</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {data.conversions.map((conversion) => (
                      <TableRow key={conversion.id}>
                        <TableCell>{new Date(conversion.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{conversion.user.name}</TableCell>
                        <TableCell>
                          <Chip size="sm" variant="flat">
                            {conversion.account.name}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-rose-400 font-semibold">
                          {formatCurrency(conversion.fromAmount, conversion.fromCurrency as any)}
                        </TableCell>
                        <TableCell className="text-emerald-400 font-semibold">
                          {formatCurrency(conversion.toAmount, conversion.toCurrency as any)}
                        </TableCell>
                        <TableCell>
                          <Chip size="sm" variant="flat" className="bg-purple-500/20 text-purple-400">
                            {conversion.exchangeRate.toFixed(2)}
                          </Chip>
                        </TableCell>
                        <TableCell>{conversion.description || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>

        <Tab key="transfers" title="Transferencias">
          <Card className="mt-4 bg-zinc-900 border border-zinc-800">
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Transferencias</h2>
            </CardHeader>
            <CardBody>
              {data.transfers.length === 0 ? (
                <p className="text-zinc-400 text-center py-8">No hay transferencias registradas</p>
              ) : (
                <Table aria-label="Transferencias">
                  <TableHeader>
                    <TableColumn>Fecha</TableColumn>
                    <TableColumn>Usuario</TableColumn>
                    <TableColumn>Desde</TableColumn>
                    <TableColumn>Hacia</TableColumn>
                    <TableColumn>Monto</TableColumn>
                    <TableColumn>Descripción</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {data.transfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell>{new Date(transfer.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{transfer.user.name}</TableCell>
                        <TableCell>{transfer.fromAccount.name}</TableCell>
                        <TableCell>{transfer.toAccount.name}</TableCell>
                        <TableCell>
                          {formatCurrency(transfer.amount, transfer.currency as any)}
                        </TableCell>
                        <TableCell>{transfer.description || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>

        <Tab key="loans" title="Préstamos">
          <Card className="mt-4 bg-zinc-900 border border-zinc-800">
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Préstamos</h2>
            </CardHeader>
            <CardBody>
              {data.loans.length === 0 ? (
                <p className="text-zinc-400 text-center py-8">No hay préstamos registrados</p>
              ) : (
                <Table aria-label="Préstamos">
                  <TableHeader>
                    <TableColumn>Fecha</TableColumn>
                    <TableColumn>De</TableColumn>
                    <TableColumn>Para</TableColumn>
                    <TableColumn>Monto</TableColumn>
                    <TableColumn>Estado</TableColumn>
                    <TableColumn>Descripción</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {data.loans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{loan.giver.name}</TableCell>
                        <TableCell>{loan.receiver.name}</TableCell>
                        <TableCell>
                          {formatCurrency(loan.amount, loan.currency as any)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="flat"
                            className={loan.isPaid ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}
                          >
                            {loan.isPaid ? "Pagado" : "Pendiente"}
                          </Chip>
                        </TableCell>
                        <TableCell>{loan.description || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}

