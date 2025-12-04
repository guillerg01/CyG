"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { IncomeForm, IncomeFormData, Income } from "@/features/incomes";
import { Account } from "@/shared/types";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { formatCurrency } from "@/shared/utils";

export default function IncomesPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) {
        params.set("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.set("endDate", filters.endDate);
      }

      const [accountsRes, incomesRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch(`/api/incomes?${params.toString()}`),
      ]);

      if (accountsRes.ok) {
        setAccounts(await accountsRes.json());
      }
      if (incomesRes.ok) {
        setIncomes(await incomesRes.json());
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

  const handleSubmit = async (data: IncomeFormData) => {
    setSubmitting(true);
    try {
      const url = editingIncome
        ? `/api/incomes/${editingIncome.id}`
        : "/api/incomes";
      const method = editingIncome ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setModalOpen(false);
        setEditingIncome(null);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Estas seguro de eliminar este ingreso?")) {
      return;
    }

    const response = await fetch(`/api/incomes/${id}`, { method: "DELETE" });
    if (response.ok) {
      fetchData();
    }
  };

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setModalOpen(true);
  };

  const totalUSD = incomes
    .filter((i) => i.currency === "USD_ZELLE" || i.currency === "USD_EFECTIVO")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalUSDT = incomes
    .filter((i) => i.currency === "USDT")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalCUP = incomes
    .filter(
      (i) => i.currency === "CUP_EFECTIVO" || i.currency === "CUP_TRANSFERENCIA"
    )
    .reduce((sum, i) => sum + i.amount, 0);

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
          <h1 className="text-2xl font-bold text-white">Ingresos</h1>
          <p className="text-zinc-400 text-sm">Gestiona todos tus ingresos</p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onPress={() => {
            setEditingIncome(null);
            setModalOpen(true);
          }}
        >
          + Agregar Ingreso
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="p-4">
            <p className="text-zinc-400 text-sm">Total USD</p>
            <p className="text-2xl font-bold text-emerald-400">
              ${totalUSD.toFixed(2)}
            </p>
          </CardBody>
        </Card>
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="p-4">
            <p className="text-zinc-400 text-sm">Total USDT</p>
            <p className="text-2xl font-bold text-emerald-400">
              {totalUSDT.toFixed(2)} USDT
            </p>
          </CardBody>
        </Card>
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="p-4">
            <p className="text-zinc-400 text-sm">Total CUP</p>
            <p className="text-2xl font-bold text-emerald-400">
              {totalCUP.toFixed(2)} CUP
            </p>
          </CardBody>
        </Card>
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="p-4">
            <p className="text-zinc-400 text-sm">Cantidad de Ingresos</p>
            <p className="text-2xl font-bold text-white">{incomes.length}</p>
          </CardBody>
        </Card>
      </div>

      <Card className="bg-zinc-900 border border-zinc-800">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Filtros</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              type="date"
              label="Desde"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              classNames={{
                input: "bg-zinc-800",
                inputWrapper: "bg-zinc-800 border-zinc-700",
              }}
            />
            <Input
              type="date"
              label="Hasta"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              classNames={{
                input: "bg-zinc-800",
                inputWrapper: "bg-zinc-800 border-zinc-700",
              }}
            />
            <div className="flex items-end">
              <Button
                variant="flat"
                onPress={() => setFilters({ startDate: "", endDate: "" })}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-zinc-900 border border-zinc-800">
        <CardBody className="p-0">
          <Table
            aria-label="Ingresos"
            classNames={{
              wrapper: "bg-transparent",
              th: "bg-zinc-800 text-zinc-300",
            }}
          >
            <TableHeader>
              <TableColumn>FECHA</TableColumn>
              <TableColumn>DESCRIPCION</TableColumn>
              <TableColumn>CUENTA</TableColumn>
              <TableColumn>MONTO</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No hay ingresos registrados">
              {incomes.map((income) => (
                <TableRow key={income.id}>
                  <TableCell>
                    <span className="text-zinc-300 text-sm">
                      {new Date(income.createdAt).toLocaleDateString("es-ES")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-white">
                      {income.description || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-zinc-400">
                      {income.account?.name || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-emerald-400 font-semibold">
                      {formatCurrency(income.amount, income.currency)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        onPress={() => handleEdit(income)}
                      >
                        <IconEdit className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        color="danger"
                        onPress={() => handleDelete(income.id)}
                      >
                        <IconTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingIncome(null);
        }}
        size="lg"
        classNames={{
          base: "bg-zinc-900 border border-zinc-800",
          header: "border-b border-zinc-800",
        }}
      >
        <ModalContent>
          <ModalHeader>
            {editingIncome ? "Editar Ingreso" : "Agregar Ingreso"}
          </ModalHeader>
          <ModalBody className="pb-6">
            <IncomeForm
              accounts={accounts}
              onSubmit={handleSubmit}
              onCancel={() => {
                setModalOpen(false);
                setEditingIncome(null);
              }}
              loading={submitting}
              initialData={
                editingIncome
                  ? {
                      amount: editingIncome.amount,
                      description: editingIncome.description || "",
                      currency: editingIncome.currency,
                      accountId: editingIncome.accountId,
                    }
                  : undefined
              }
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
