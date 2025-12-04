"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import { ExpenseForm, ExpenseFormData, Expense, useExpenses } from "@/features/expenses";
import { Account, Category, PaymentMethod, ExpenseType } from "@/shared/types";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { formatCurrency } from "@/shared/utils";

export default function ExpensesPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [filters, setFilters] = useState({
    categoryId: "",
    paymentMethod: "",
    expenseType: "",
    startDate: "",
    endDate: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.categoryId) {
        params.set("categoryId", filters.categoryId);
      }
      if (filters.paymentMethod) {
        params.set("paymentMethod", filters.paymentMethod);
      }
      if (filters.expenseType) {
        params.set("expenseType", filters.expenseType);
      }
      if (filters.startDate) {
        params.set("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.set("endDate", filters.endDate);
      }

      const [accountsRes, categoriesRes, expensesRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/categories"),
        fetch(`/api/expenses?${params.toString()}`),
      ]);

      if (accountsRes.ok) {
        setAccounts(await accountsRes.json());
      }
      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json());
      }
      if (expensesRes.ok) {
        setExpenses(await expensesRes.json());
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

  const handleSubmit = async (data: ExpenseFormData) => {
    setSubmitting(true);
    try {
      const url = editingExpense
        ? `/api/expenses/${editingExpense.id}`
        : "/api/expenses";
      const method = editingExpense ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setModalOpen(false);
        setEditingExpense(null);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Estas seguro de eliminar este gasto?")) {
      return;
    }

    const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (response.ok) {
      fetchData();
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const totalUSD = expenses
    .filter(
      (e) =>
        (e.currency === "USD_ZELLE" || e.currency === "USD_EFECTIVO") &&
        e.expenseType === "REALIZED"
    )
    .reduce((sum, e) => sum + e.amount, 0);
  const totalUSDT = expenses
    .filter((e) => e.currency === "USDT" && e.expenseType === "REALIZED")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalCUP = expenses
    .filter(
      (e) =>
        (e.currency === "CUP_EFECTIVO" || e.currency === "CUP_TRANSFERENCIA") &&
        e.expenseType === "REALIZED"
    )
    .reduce((sum, e) => sum + e.amount, 0);

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
          <h1 className="text-2xl font-bold text-white">Gastos</h1>
          <p className="text-zinc-400 text-sm">Gestiona todos tus gastos</p>
        </div>
        <Button
          className="bg-rose-600 hover:bg-rose-700"
          onPress={() => {
            setEditingExpense(null);
            setModalOpen(true);
          }}
        >
          + Agregar Gasto
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="p-4">
            <p className="text-zinc-400 text-sm">Total USD</p>
            <p className="text-2xl font-bold text-rose-400">${totalUSD.toFixed(2)}</p>
          </CardBody>
        </Card>
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="p-4">
            <p className="text-zinc-400 text-sm">Total USDT</p>
            <p className="text-2xl font-bold text-rose-400">{totalUSDT.toFixed(2)} USDT</p>
          </CardBody>
        </Card>
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="p-4">
            <p className="text-zinc-400 text-sm">Total CUP</p>
            <p className="text-2xl font-bold text-rose-400">{totalCUP.toFixed(2)} CUP</p>
          </CardBody>
        </Card>
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="p-4">
            <p className="text-zinc-400 text-sm">Cantidad de Gastos</p>
            <p className="text-2xl font-bold text-white">{expenses.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="p-4">
            <p className="text-zinc-400 text-sm">Gastos Planeados</p>
            <p className="text-2xl font-bold text-amber-400">
              {expenses.filter((e) => e.expenseType === "PLANNED").length}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card className="bg-zinc-900 border border-zinc-800">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Filtros</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select
              label="Categoria"
              selectedKeys={filters.categoryId ? [filters.categoryId] : []}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              classNames={{ trigger: "bg-zinc-800 border-zinc-700" }}
            >
              {categories.map((c) => (
                <SelectItem key={c.id}>{c.name}</SelectItem>
              ))}
            </Select>

            <Select
              label="Metodo de Pago"
              selectedKeys={filters.paymentMethod ? [filters.paymentMethod] : []}
              onChange={(e) =>
                setFilters({ ...filters, paymentMethod: e.target.value as PaymentMethod })
              }
              classNames={{ trigger: "bg-zinc-800 border-zinc-700" }}
            >
              <SelectItem key="CASH">Efectivo</SelectItem>
              <SelectItem key="TRANSFER">Transferencia</SelectItem>
            </Select>

            <Select
              label="Tipo"
              selectedKeys={filters.expenseType ? [filters.expenseType] : []}
              onChange={(e) =>
                setFilters({ ...filters, expenseType: e.target.value as ExpenseType })
              }
              classNames={{ trigger: "bg-zinc-800 border-zinc-700" }}
            >
              <SelectItem key="REALIZED">Realizado</SelectItem>
              <SelectItem key="PLANNED">Planeado</SelectItem>
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
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="flat"
              size="sm"
              onPress={() =>
                setFilters({
                  categoryId: "",
                  paymentMethod: "",
                  expenseType: "",
                  startDate: "",
                  endDate: "",
                })
              }
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-zinc-900 border border-zinc-800">
        <CardBody className="p-0">
          <Table
            aria-label="Gastos"
            classNames={{
              wrapper: "bg-transparent",
              th: "bg-zinc-800 text-zinc-300",
            }}
          >
            <TableHeader>
              <TableColumn>FECHA</TableColumn>
              <TableColumn>DESCRIPCION</TableColumn>
              <TableColumn>CATEGORIA</TableColumn>
              <TableColumn>METODO</TableColumn>
              <TableColumn>TIPO</TableColumn>
              <TableColumn>MONTO</TableColumn>
              <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No hay gastos registrados">
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <span className="text-zinc-300 text-sm">
                      {new Date(expense.createdAt).toLocaleDateString("es-ES")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-white">{expense.description || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" className="bg-zinc-800">
                      {expense.category?.name || "-"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      className={
                        expense.paymentMethod === "CASH"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-blue-500/20 text-blue-400"
                      }
                    >
                      {expense.paymentMethod === "CASH" ? "Efectivo" : "Transferencia"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      className={
                        expense.expenseType === "REALIZED"
                          ? "bg-zinc-700"
                          : "bg-amber-500/20 text-amber-400"
                      }
                    >
                      {expense.expenseType === "REALIZED" ? "Realizado" : "Planeado"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-rose-400 font-semibold">
                      {formatCurrency(expense.amount, expense.currency)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        onPress={() => handleEdit(expense)}
                      >
                        <IconEdit className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        color="danger"
                        onPress={() => handleDelete(expense.id)}
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
          setEditingExpense(null);
        }}
        size="lg"
        classNames={{
          base: "bg-zinc-900 border border-zinc-800",
          header: "border-b border-zinc-800",
        }}
      >
        <ModalContent>
          <ModalHeader>
            {editingExpense ? "Editar Gasto" : "Agregar Gasto"}
          </ModalHeader>
          <ModalBody className="pb-6">
            <ExpenseForm
              accounts={accounts}
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={() => {
                setModalOpen(false);
                setEditingExpense(null);
              }}
              loading={submitting}
              isEdit={!!editingExpense}
              initialData={
                editingExpense
                  ? {
                      amount: editingExpense.amount,
                      description: editingExpense.description || "",
                      currency: editingExpense.currency,
                      paymentMethod: editingExpense.paymentMethod,
                      expenseType: editingExpense.expenseType,
                      isShared: editingExpense.isShared,
                      accountId: editingExpense.accountId,
                      categoryId: editingExpense.categoryId,
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

