"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Statistics, User } from "@/types";

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedUser) {
        params.set("userId", selectedUser);
      }
      if (dateRange.startDate) {
        params.set("startDate", dateRange.startDate);
      }
      if (dateRange.endDate) {
        params.set("endDate", dateRange.endDate);
      }

      const [statsRes, usersRes] = await Promise.all([
        fetch(`/api/statistics?${params.toString()}`),
        fetch("/api/users"),
      ]);

      if (statsRes.ok) {
        setStatistics(await statsRes.json());
      }
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedUser, dateRange]);

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

  const categoryData = statistics?.byCategory || {};
  const monthlyExpenses = statistics?.monthly.expenses || {};
  const monthlyIncomes = statistics?.monthly.incomes || {};

  const sortedMonths = [
    ...new Set([...Object.keys(monthlyExpenses), ...Object.keys(monthlyIncomes)]),
  ].sort();

  const maxCategoryTotal = Math.max(
    ...Object.values(categoryData).map((v) => v.USD + v.USDT),
    1
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Estadisticas</h1>
          <p className="text-zinc-400 text-sm">Analiza tu comportamiento financiero</p>
        </div>
      </div>

      <Card className="bg-zinc-900 border border-zinc-800">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Filtros</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Usuario"
              selectedKeys={selectedUser ? [selectedUser] : []}
              onChange={(e) => setSelectedUser(e.target.value)}
              classNames={{ trigger: "bg-zinc-800 border-zinc-700" }}
            >
              {users.map((u) => (
                <SelectItem key={u.id}>{u.name}</SelectItem>
              ))}
            </Select>

            <Input
              type="date"
              label="Desde"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              classNames={{
                input: "bg-zinc-800",
                inputWrapper: "bg-zinc-800 border-zinc-700",
              }}
            />

            <Input
              type="date"
              label="Hasta"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              classNames={{
                input: "bg-zinc-800",
                inputWrapper: "bg-zinc-800 border-zinc-700",
              }}
            />
          </div>
        </CardBody>
      </Card>

      <Tabs
        aria-label="Estadisticas"
        classNames={{
          tabList: "bg-zinc-900 border border-zinc-800",
          cursor: "bg-emerald-600",
          tab: "text-zinc-400 data-[selected=true]:text-white",
        }}
      >
        <Tab key="general" title="General">
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-emerald-900/50 to-emerald-950 border border-emerald-700/50">
                <CardBody className="p-5">
                  <p className="text-emerald-300 text-sm">Ingresos USD</p>
                  <p className="text-3xl font-bold text-white">
                    ${(statistics?.totals.incomes.USD || 0).toFixed(2)}
                  </p>
                </CardBody>
              </Card>
              <Card className="bg-gradient-to-br from-blue-900/50 to-blue-950 border border-blue-700/50">
                <CardBody className="p-5">
                  <p className="text-blue-300 text-sm">Ingresos USDT</p>
                  <p className="text-3xl font-bold text-white">
                    {(statistics?.totals.incomes.USDT || 0).toFixed(2)}
                  </p>
                </CardBody>
              </Card>
              <Card className="bg-gradient-to-br from-rose-900/50 to-rose-950 border border-rose-700/50">
                <CardBody className="p-5">
                  <p className="text-rose-300 text-sm">Gastos USD</p>
                  <p className="text-3xl font-bold text-white">
                    ${(statistics?.totals.expenses.USD || 0).toFixed(2)}
                  </p>
                </CardBody>
              </Card>
              <Card className="bg-gradient-to-br from-amber-900/50 to-amber-950 border border-amber-700/50">
                <CardBody className="p-5">
                  <p className="text-amber-300 text-sm">Gastos USDT</p>
                  <p className="text-3xl font-bold text-white">
                    {(statistics?.totals.expenses.USDT || 0).toFixed(2)}
                  </p>
                </CardBody>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-zinc-900 border border-zinc-800">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-white">Balance</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-lg">
                    <span className="text-zinc-300">Balance USD</span>
                    <span
                      className={`text-xl font-bold ${(statistics?.totals.balance.USD || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      ${(statistics?.totals.balance.USD || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-lg">
                    <span className="text-zinc-300">Balance USDT</span>
                    <span
                      className={`text-xl font-bold ${(statistics?.totals.balance.USDT || 0) >= 0 ? "text-blue-400" : "text-rose-400"}`}
                    >
                      {(statistics?.totals.balance.USDT || 0).toFixed(2)}
                    </span>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-zinc-900 border border-zinc-800">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-white">Por Metodo de Pago</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-zinc-300">Efectivo</span>
                    </div>
                    <span className="text-white font-semibold">
                      ${(statistics?.byPaymentMethod.cash || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-zinc-300">Transferencia</span>
                    </div>
                    <span className="text-white font-semibold">
                      ${(statistics?.byPaymentMethod.transfer || 0).toFixed(2)}
                    </span>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>

        <Tab key="categories" title="Por Categoria">
          <div className="mt-6">
            <Card className="bg-zinc-900 border border-zinc-800">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white">Gastos por Categoria</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                {Object.keys(categoryData).length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">No hay datos de categorias</p>
                ) : (
                  Object.entries(categoryData).map(([category, amounts]) => {
                    const total = amounts.USD + amounts.USDT;
                    const percentage = (total / maxCategoryTotal) * 100;

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white font-medium">{category}</span>
                          <div className="text-right">
                            <span className="text-emerald-400">${amounts.USD.toFixed(2)}</span>
                            <span className="text-zinc-500 mx-2">/</span>
                            <span className="text-blue-400">{amounts.USDT.toFixed(2)} USDT</span>
                          </div>
                        </div>
                        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                            style={{
                              width: `${(amounts.USD / maxCategoryTotal) * 100}%`,
                            }}
                          />
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                            style={{
                              width: `${(amounts.USDT / maxCategoryTotal) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-zinc-500 text-xs text-right">
                          {percentage.toFixed(1)}% del total
                        </p>
                      </div>
                    );
                  })
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="monthly" title="Por Mes">
          <div className="mt-6">
            <Card className="bg-zinc-900 border border-zinc-800">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white">Evolucion Mensual</h3>
              </CardHeader>
              <CardBody>
                {sortedMonths.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">No hay datos mensuales</p>
                ) : (
                  <div className="space-y-6">
                    {sortedMonths.map((month) => {
                      const expenses = monthlyExpenses[month] || { USD: 0, USDT: 0 };
                      const incomes = monthlyIncomes[month] || { USD: 0, USDT: 0 };
                      const balanceUSD = incomes.USD - expenses.USD;
                      const balanceUSDT = incomes.USDT - expenses.USDT;

                      const [year, monthNum] = month.split("-");
                      const monthName = new Date(
                        parseInt(year),
                        parseInt(monthNum) - 1
                      ).toLocaleDateString("es-ES", { month: "long", year: "numeric" });

                      return (
                        <div key={month} className="p-4 bg-zinc-800/50 rounded-lg">
                          <h4 className="text-white font-semibold mb-4 capitalize">
                            {monthName}
                          </h4>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <p className="text-zinc-500 text-xs mb-1">Ingresos</p>
                              <p className="text-emerald-400 font-semibold">
                                ${incomes.USD.toFixed(2)}
                              </p>
                              <p className="text-blue-400 text-sm">
                                {incomes.USDT.toFixed(2)} USDT
                              </p>
                            </div>
                            <div>
                              <p className="text-zinc-500 text-xs mb-1">Gastos</p>
                              <p className="text-rose-400 font-semibold">
                                ${expenses.USD.toFixed(2)}
                              </p>
                              <p className="text-amber-400 text-sm">
                                {expenses.USDT.toFixed(2)} USDT
                              </p>
                            </div>
                            <div>
                              <p className="text-zinc-500 text-xs mb-1">Balance USD</p>
                              <p
                                className={`font-bold ${balanceUSD >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                              >
                                ${balanceUSD.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-zinc-500 text-xs mb-1">Balance USDT</p>
                              <p
                                className={`font-bold ${balanceUSDT >= 0 ? "text-blue-400" : "text-rose-400"}`}
                              >
                                {balanceUSDT.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

