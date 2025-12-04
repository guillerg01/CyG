"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { Account, Currency, User } from "@/shared/types";
import { Loan } from "@/features/loans";
import { formatCurrency } from "@/shared/utils";

export default function LoansPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const [formData, setFormData] = useState({
    amount: 0,
    description: "",
    currency: "USD" as Currency,
    dueDate: "",
    receiverId: "",
    fromAccountId: "",
    toAccountId: "",
  });

  const [paymentData, setPaymentData] = useState({
    paymentAmount: 0,
    paymentCurrency: "USD" as Currency,
    exchangeRate: 1,
  });

  const fetchData = useCallback(async () => {
    try {
      const [accountsRes, usersRes, loansRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/users"),
        fetch("/api/loans"),
      ]);

      if (accountsRes.ok) {
        setAccounts(await accountsRes.json());
      }
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
      if (loansRes.ok) {
        setLoans(await loansRes.json());
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
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setModalOpen(false);
        setFormData({
          amount: 0,
          description: "",
          currency: "USD_ZELLE",
          dueDate: "",
          receiverId: "",
          fromAccountId: "",
          toAccountId: "",
        });
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/loans/${selectedLoan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (response.ok) {
        setPayModalOpen(false);
        setSelectedLoan(null);
        setPaymentData({ paymentAmount: 0, paymentCurrency: "USD_ZELLE", exchangeRate: 1 });
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openPayModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setPaymentData({
      paymentAmount: loan.amount - loan.paidAmount,
      paymentCurrency: loan.currency,
      exchangeRate: 1,
    });
    setPayModalOpen(true);
  };

  const loansGiven = loans.filter((l) => l.giver?.id);
  const loansReceived = loans.filter((l) => l.receiver?.id);
  const pendingAmount = loans
    .filter((l) => !l.isPaid)
    .reduce((sum, l) => sum + (l.amount - l.paidAmount), 0);

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
          <h1 className="text-2xl font-bold text-white">Prestamos</h1>
          <p className="text-zinc-400 text-sm">Gestiona prestamos entre cuentas</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onPress={() => setModalOpen(true)}
        >
          + Nuevo Prestamo
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="p-4">
            <p className="text-zinc-400 text-sm">Total Prestamos</p>
            <p className="text-2xl font-bold text-white">{loans.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="p-4">
            <p className="text-zinc-400 text-sm">Monto Pendiente</p>
            <p className="text-2xl font-bold text-amber-400">${pendingAmount.toFixed(2)}</p>
          </CardBody>
        </Card>
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="p-4">
            <p className="text-zinc-400 text-sm">Prestamos Pagados</p>
            <p className="text-2xl font-bold text-emerald-400">
              {loans.filter((l) => l.isPaid).length}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Prestamos Dados</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {loansGiven.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">No hay prestamos dados</p>
            ) : (
              loansGiven.map((loan) => (
                <div
                  key={loan.id}
                  className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-medium">
                        A: {loan.receiver?.name || "Usuario"}
                      </p>
                      <p className="text-zinc-500 text-sm">{loan.description || "Sin descripcion"}</p>
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      className={loan.isPaid ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}
                    >
                      {loan.isPaid ? "Pagado" : "Pendiente"}
                    </Chip>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Monto</span>
                      <span className="text-white">
                        {formatCurrency(loan.amount, loan.currency)}
                      </span>
                    </div>
                    <Progress
                      value={(loan.paidAmount / loan.amount) * 100}
                      size="sm"
                      classNames={{
                        indicator: "bg-emerald-500",
                        track: "bg-zinc-700",
                      }}
                    />
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Pagado: ${loan.paidAmount.toFixed(2)}</span>
                      <span>Restante: ${(loan.amount - loan.paidAmount).toFixed(2)}</span>
                    </div>
                  </div>
                  {!loan.isPaid && (
                    <Button
                      size="sm"
                      variant="flat"
                      className="mt-3 w-full"
                      onPress={() => openPayModal(loan)}
                    >
                      Registrar Pago
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card className="bg-zinc-900 border border-zinc-800">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Prestamos Recibidos</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {loansReceived.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">No hay prestamos recibidos</p>
            ) : (
              loansReceived.map((loan) => (
                <div
                  key={loan.id}
                  className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-medium">
                        De: {loan.giver?.name || "Usuario"}
                      </p>
                      <p className="text-zinc-500 text-sm">{loan.description || "Sin descripcion"}</p>
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      className={loan.isPaid ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}
                    >
                      {loan.isPaid ? "Pagado" : "Pendiente"}
                    </Chip>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Monto</span>
                      <span className="text-white">
                        {formatCurrency(loan.amount, loan.currency)}
                      </span>
                    </div>
                    <Progress
                      value={(loan.paidAmount / loan.amount) * 100}
                      size="sm"
                      classNames={{
                        indicator: "bg-emerald-500",
                        track: "bg-zinc-700",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

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
          <ModalHeader>Nuevo Prestamo</ModalHeader>
          <ModalBody className="pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                label="Prestar a"
                selectedKeys={formData.receiverId ? [formData.receiverId] : []}
                onChange={(e) => setFormData({ ...formData, receiverId: e.target.value })}
                classNames={{ trigger: "bg-zinc-800 border-zinc-700" }}
              >
                {users.map((u) => (
                  <SelectItem key={u.id}>{u.name}</SelectItem>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Desde Cuenta"
                  selectedKeys={formData.fromAccountId ? [formData.fromAccountId] : []}
                  onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
                  classNames={{ trigger: "bg-zinc-800 border-zinc-700" }}
                >
                  {accounts.map((a) => (
                    <SelectItem key={a.id}>{a.name}</SelectItem>
                  ))}
                </Select>

                <Select
                  label="A Cuenta"
                  selectedKeys={formData.toAccountId ? [formData.toAccountId] : []}
                  onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                  classNames={{ trigger: "bg-zinc-800 border-zinc-700" }}
                >
                  {accounts.map((a) => (
                    <SelectItem key={a.id}>{a.name}</SelectItem>
                  ))}
                </Select>
              </div>

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
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  isLoading={submitting}
                >
                  Crear Prestamo
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
          setSelectedLoan(null);
        }}
        size="md"
        classNames={{
          base: "bg-zinc-900 border border-zinc-800",
          header: "border-b border-zinc-800",
        }}
      >
        <ModalContent>
          <ModalHeader>Registrar Pago</ModalHeader>
          <ModalBody className="pb-6">
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Monto del Pago"
                  type="number"
                  step="0.01"
                  value={paymentData.paymentAmount.toString()}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      paymentAmount: parseFloat(e.target.value) || 0,
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
                  selectedKeys={[paymentData.paymentCurrency]}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      paymentCurrency: e.target.value as Currency,
                    })
                  }
                  classNames={{ trigger: "bg-zinc-800 border-zinc-700" }}
                >
                  <SelectItem key="USD">USD</SelectItem>
                  <SelectItem key="USDT">USDT</SelectItem>
                </Select>
              </div>

              {selectedLoan && paymentData.paymentCurrency !== selectedLoan.currency && (
                <Input
                  label="Tasa de Cambio"
                  type="number"
                  step="0.0001"
                  value={paymentData.exchangeRate.toString()}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      exchangeRate: parseFloat(e.target.value) || 1,
                    })
                  }
                  classNames={{
                    input: "bg-zinc-800",
                    inputWrapper: "bg-zinc-800 border-zinc-700",
                  }}
                />
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="flat"
                  className="flex-1"
                  onPress={() => {
                    setPayModalOpen(false);
                    setSelectedLoan(null);
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

