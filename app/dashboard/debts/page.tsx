"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { Account, Debt, Currency } from "@/types";
import { IconTrash } from "@tabler/icons-react";

export default function DebtsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  const [formData, setFormData] = useState({
    amount: 0,
    description: "",
    currency: "USD" as Currency,
    dueDate: "",
    creditor: "",
    accountId: "",
  });

  const [paymentAmount, setPaymentAmount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [accountsRes, debtsRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/debts"),
      ]);

      if (accountsRes.ok) {
        setAccounts(await accountsRes.json());
      }
      if (debtsRes.ok) {
        setDebts(await debtsRes.json());
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setModalOpen(false);
        setFormData({
          amount: 0,
          description: "",
          currency: "USD",
          dueDate: "",
          creditor: "",
          accountId: "",
        });
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/debts/${selectedDebt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentAmount }),
      });

      if (response.ok) {
        setPayModalOpen(false);
        setSelectedDebt(null);
        setPaymentAmount(0);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Estas seguro de eliminar esta deuda?")) {
      return;
    }

    const response = await fetch(`/api/debts/${id}`, { method: "DELETE" });
    if (response.ok) {
      fetchData();
    }
  };

  const openPayModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.amount - debt.paidAmount);
    setPayModalOpen(true);
  };

  const totalPending = debts
    .filter((d) => !d.isPaid)
    .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);
  const totalPaid = debts
    .filter((d) => d.isPaid)
    .reduce((sum, d) => sum + d.amount, 0);

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
          <h1 className="text-2xl font-bold text-white">Deudas</h1>
          <p className="text-zinc-400 text-sm">Gestiona tus deudas pendientes</p>
        </div>
        <Button
          className="bg-amber-600 hover:bg-amber-700"
          onPress={() => setModalOpen(true)}
        >
          + Nueva Deuda
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="p-4">
            <p className="text-zinc-400 text-sm">Total Deudas</p>
            <p className="text-2xl font-bold text-white">{debts.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/50 to-amber-950 border border-amber-700/50">
          <CardBody className="p-4">
            <p className="text-amber-300 text-sm">Monto Pendiente</p>
            <p className="text-2xl font-bold text-white">${totalPending.toFixed(2)}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-900/50 to-emerald-950 border border-emerald-700/50">
          <CardBody className="p-4">
            <p className="text-emerald-300 text-sm">Total Pagado</p>
            <p className="text-2xl font-bold text-white">${totalPaid.toFixed(2)}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {debts.map((debt) => (
          <Card key={debt.id} className="bg-zinc-900 border border-zinc-800">
            <CardHeader className="flex justify-between items-start pb-2">
              <div>
                <p className="text-white font-medium">{debt.creditor}</p>
                <p className="text-zinc-500 text-sm">{debt.description || "Sin descripcion"}</p>
              </div>
              <Chip
                size="sm"
                variant="flat"
                className={debt.isPaid ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}
              >
                {debt.isPaid ? "Pagado" : "Pendiente"}
              </Chip>
            </CardHeader>
            <CardBody className="pt-0 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Monto Total</span>
                <span className="text-white font-semibold">
                  {debt.currency === "USD" ? "$" : ""}
                  {debt.amount.toFixed(2)}
                  {debt.currency === "USDT" ? " USDT" : ""}
                </span>
              </div>

              <Progress
                value={(debt.paidAmount / debt.amount) * 100}
                size="sm"
                classNames={{
                  indicator: "bg-emerald-500",
                  track: "bg-zinc-700",
                }}
              />

              <div className="flex justify-between text-xs text-zinc-500">
                <span>Pagado: ${debt.paidAmount.toFixed(2)}</span>
                <span>Restante: ${(debt.amount - debt.paidAmount).toFixed(2)}</span>
              </div>

              {debt.dueDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Vence</span>
                  <span className="text-zinc-300">
                    {new Date(debt.dueDate).toLocaleDateString("es-ES")}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {!debt.isPaid && (
                  <Button
                    size="sm"
                    variant="flat"
                    className="flex-1"
                    onPress={() => openPayModal(debt)}
                  >
                    Pagar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  isIconOnly
                  onPress={() => handleDelete(debt.id)}
                >
                  <IconTrash className="w-4 h-4" />
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {debts.length === 0 && (
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="py-12 text-center">
            <p className="text-zinc-500 mb-4">No tienes deudas registradas</p>
            <Button className="bg-amber-600 hover:bg-amber-700" onPress={() => setModalOpen(true)}>
              Registrar Primera Deuda
            </Button>
          </CardBody>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        size="lg"
        classNames={{
          base: "bg-zinc-900 border border-zinc-800",
          header: "border-b border-zinc-800",
        }}
      >
        <ModalContent>
          <ModalHeader>Nueva Deuda</ModalHeader>
          <ModalBody className="pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Acreedor (a quien le debo)"
                value={formData.creditor}
                onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
                isRequired
                classNames={{
                  input: "bg-zinc-800",
                  inputWrapper: "bg-zinc-800 border-zinc-700",
                }}
              />

              <div className="grid grid-cols-2 gap-4">
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
                <Select
                  label="Moneda"
                  selectedKeys={[formData.currency]}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value as Currency })
                  }
                  classNames={{ trigger: "bg-zinc-800 border-zinc-700" }}
                >
                  <SelectItem key="USD">USD</SelectItem>
                  <SelectItem key="USDT">USDT</SelectItem>
                </Select>
              </div>

              <Input
                label="Descripcion"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                classNames={{
                  input: "bg-zinc-800",
                  inputWrapper: "bg-zinc-800 border-zinc-700",
                }}
              />

              <Select
                label="Cuenta"
                selectedKeys={formData.accountId ? [formData.accountId] : []}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                classNames={{ trigger: "bg-zinc-800 border-zinc-700" }}
              >
                {accounts.map((a) => (
                  <SelectItem key={a.id}>{a.name}</SelectItem>
                ))}
              </Select>

              <Input
                type="date"
                label="Fecha de Vencimiento"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                classNames={{
                  input: "bg-zinc-800",
                  inputWrapper: "bg-zinc-800 border-zinc-700",
                }}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="flat"
                  className="flex-1"
                  onPress={() => setModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  isLoading={submitting}
                >
                  Crear Deuda
                </Button>
              </div>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={payModalOpen}
        onClose={() => {
          setPayModalOpen(false);
          setSelectedDebt(null);
        }}
        size="md"
        classNames={{
          base: "bg-zinc-900 border border-zinc-800",
          header: "border-b border-zinc-800",
        }}
      >
        <ModalContent>
          <ModalHeader>Pagar Deuda</ModalHeader>
          <ModalBody className="pb-6">
            <form onSubmit={handlePayment} className="space-y-4">
              <Input
                label="Monto del Pago"
                type="number"
                step="0.01"
                value={paymentAmount.toString()}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                isRequired
                classNames={{
                  input: "bg-zinc-800",
                  inputWrapper: "bg-zinc-800 border-zinc-700",
                }}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="flat"
                  className="flex-1"
                  onPress={() => {
                    setPayModalOpen(false);
                    setSelectedDebt(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  isLoading={submitting}
                >
                  Registrar Pago
                </Button>
              </div>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}

