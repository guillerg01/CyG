"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import { TransactionType } from "@/shared/types";
import { Transaction, Change } from "@/features/transactions";
import { formatCurrency } from "@/shared/utils";

const typeLabels: Record<TransactionType, string> = {
  EXPENSE: "Gasto",
  INCOME: "Ingreso",
  LOAN: "Prestamo",
  DEBT: "Deuda",
  CONVERSION: "Conversion",
  LOAN_PAYMENT: "Pago Prestamo",
  DEBT_PAYMENT: "Pago Deuda",
};

const typeColors: Record<TransactionType, string> = {
  EXPENSE: "bg-rose-500/20 text-rose-400",
  INCOME: "bg-emerald-500/20 text-emerald-400",
  LOAN: "bg-blue-500/20 text-blue-400",
  DEBT: "bg-amber-500/20 text-amber-400",
  CONVERSION: "bg-purple-500/20 text-purple-400",
  LOAN_PAYMENT: "bg-blue-500/20 text-blue-400",
  DEBT_PAYMENT: "bg-amber-500/20 text-amber-400",
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"transactions" | "changes">("transactions");

  const [filters, setFilters] = useState({
    type: "",
    startDate: "",
    endDate: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) {
        params.set("type", filters.type);
      }
      if (filters.startDate) {
        params.set("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.set("endDate", filters.endDate);
      }

      const [transactionsRes, changesRes] = await Promise.all([
        fetch(`/api/transactions?${params.toString()}`),
        fetch("/api/changes?limit=50"),
      ]);

      if (transactionsRes.ok) {
        setTransactions(await transactionsRes.json());
      }
      if (changesRes.ok) {
        setChanges(await changesRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Historial</h1>
        <p className="text-zinc-400 text-sm">Registro de todas las transacciones y cambios</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === "transactions" ? "solid" : "flat"}
          className={activeTab === "transactions" ? "bg-emerald-600" : ""}
          onPress={() => setActiveTab("transactions")}
        >
          Transacciones
        </Button>
        <Button
          variant={activeTab === "changes" ? "solid" : "flat"}
          className={activeTab === "changes" ? "bg-emerald-600" : ""}
          onPress={() => setActiveTab("changes")}
        >
          Historial de Cambios
        </Button>
      </div>

      {activeTab === "transactions" && (
        <>
          <Card className="bg-zinc-900 border border-zinc-800">
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Filtros</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Select
                  label="Tipo"
                  selectedKeys={filters.type ? [filters.type] : []}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  classNames={{ trigger: "bg-zinc-800 border-zinc-700" }}
                >
                  <SelectItem key="EXPENSE">Gasto</SelectItem>
                  <SelectItem key="INCOME">Ingreso</SelectItem>
                  <SelectItem key="LOAN">Prestamo</SelectItem>
                  <SelectItem key="DEBT">Deuda</SelectItem>
                  <SelectItem key="CONVERSION">Conversion</SelectItem>
                  <SelectItem key="LOAN_PAYMENT">Pago Prestamo</SelectItem>
                  <SelectItem key="DEBT_PAYMENT">Pago Deuda</SelectItem>
                </Select>

                <Input
                  type="date"
                  label="Desde"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  classNames={{
                    input: "bg-zinc-800",
                    inputWrapper: "bg-zinc-800 border-zinc-700",
                  }}
                />

                <Input
                  type="date"
                  label="Hasta"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  classNames={{
                    input: "bg-zinc-800",
                    inputWrapper: "bg-zinc-800 border-zinc-700",
                  }}
                />

                <div className="flex items-end">
                  <Button
                    variant="flat"
                    onPress={() => setFilters({ type: "", startDate: "", endDate: "" })}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-zinc-900 border border-zinc-800">
            <CardBody className="p-0">
              <Table
                aria-label="Transacciones"
                classNames={{
                  wrapper: "bg-transparent",
                  th: "bg-zinc-800 text-zinc-300",
                }}
              >
                <TableHeader>
                  <TableColumn>FECHA</TableColumn>
                  <TableColumn>TIPO</TableColumn>
                  <TableColumn>DESCRIPCION</TableColumn>
                  <TableColumn>CUENTA</TableColumn>
                  <TableColumn>MONTO</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No hay transacciones">
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <span className="text-zinc-300 text-sm">
                          {new Date(transaction.createdAt).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          className={typeColors[transaction.type]}
                        >
                          {typeLabels[transaction.type]}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="text-white">
                          {transaction.description || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-400">
                          {transaction.account?.name || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            transaction.type === "EXPENSE" ||
                            transaction.type === "DEBT" ||
                            transaction.type === "DEBT_PAYMENT"
                              ? "text-rose-400"
                              : "text-emerald-400"
                          }
                        >
                          {transaction.type === "EXPENSE" ||
                          transaction.type === "DEBT" ||
                          transaction.type === "DEBT_PAYMENT"
                            ? "-"
                            : "+"}
                          {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </>
      )}

      {activeTab === "changes" && (
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Historial de Cambios</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {changes.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">No hay cambios registrados</p>
            ) : (
              changes.map((change) => (
                <div
                  key={change.id}
                  className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Chip
                        size="sm"
                        variant="flat"
                        className={
                          change.action === "CREATE"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : change.action === "UPDATE"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-rose-500/20 text-rose-400"
                        }
                      >
                        {change.action === "CREATE"
                          ? "Creado"
                          : change.action === "UPDATE"
                            ? "Actualizado"
                            : "Eliminado"}
                      </Chip>
                      <Chip size="sm" variant="flat" className="bg-zinc-700">
                        {change.entityType}
                      </Chip>
                    </div>
                    <span className="text-zinc-500 text-xs">
                      {new Date(change.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm">
                    Por: <span className="text-white">{change.author?.name || "Usuario"}</span>
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

