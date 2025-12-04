"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Account } from "@/shared/types";
import { IconEdit, IconTrash } from "@tabler/icons-react";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    isShared: false,
  });

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await fetch("/api/accounts");
      if (response.ok) {
        setAccounts(await response.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingAccount ? `/api/accounts/${editingAccount.id}` : "/api/accounts";
      const method = editingAccount ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setModalOpen(false);
        setEditingAccount(null);
        setFormData({ name: "", isShared: false });
        fetchAccounts();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Estas seguro de eliminar esta cuenta?")) {
      return;
    }

    const response = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (response.ok) {
      fetchAccounts();
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({ name: account.name, isShared: account.isShared });
    setModalOpen(true);
  };

  const openModal = () => {
    setEditingAccount(null);
    setFormData({ name: "", isShared: false });
    setModalOpen(true);
  };

  const totalUSD = accounts.reduce(
    (sum, a) => sum + a.balanceUSDZelle + a.balanceUSDEfectivo,
    0
  );
  const totalUSDT = accounts.reduce((sum, a) => sum + a.balanceUSDT, 0);
  const totalCUP = accounts.reduce(
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
          <h1 className="text-2xl font-bold text-white">Cuentas</h1>
          <p className="text-zinc-400 text-sm">Gestiona tus cuentas bancarias</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onPress={openModal}>
          + Nueva Cuenta
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-900/50 to-emerald-950 border border-emerald-700/50">
          <CardBody className="p-5">
            <p className="text-emerald-300 text-sm">Balance Total USD</p>
            <p className="text-3xl font-bold text-white">${totalUSD.toFixed(2)}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-950 border border-blue-700/50">
          <CardBody className="p-5">
            <p className="text-blue-300 text-sm">Balance Total USDT</p>
            <p className="text-3xl font-bold text-white">{totalUSDT.toFixed(2)} USDT</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/50 to-amber-950 border border-amber-700/50">
          <CardBody className="p-5">
            <p className="text-amber-300 text-sm">Balance Total CUP</p>
            <p className="text-3xl font-bold text-white">{totalCUP.toFixed(2)} CUP</p>
          </CardBody>
        </Card>
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="p-5">
            <p className="text-zinc-400 text-sm">Total de Cuentas</p>
            <p className="text-3xl font-bold text-white">{accounts.length}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <Card key={account.id} className="bg-zinc-900 border border-zinc-800">
            <CardHeader className="flex justify-between items-start pb-2">
              <div>
                <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                {account.isShared && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded mt-1 inline-block">
                    Cuenta Compartida
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={() => handleEdit(account)}
                >
                  <IconEdit className="w-4 h-4" />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  color="danger"
                  onPress={() => handleDelete(account.id)}
                >
                  <IconTrash className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-400 text-xs">USD Zelle</span>
                  <span
                    className={`font-bold text-sm ${account.balanceUSDZelle >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    ${account.balanceUSDZelle.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-400 text-xs">USD Efectivo</span>
                  <span
                    className={`font-bold text-sm ${account.balanceUSDEfectivo >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    ${account.balanceUSDEfectivo.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-400 text-xs">USDT</span>
                  <span
                    className={`font-bold text-sm ${account.balanceUSDT >= 0 ? "text-blue-400" : "text-rose-400"}`}
                  >
                    {account.balanceUSDT.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-400 text-xs">CUP Efectivo</span>
                  <span
                    className={`font-bold text-sm ${account.balanceCUPEfectivo >= 0 ? "text-amber-400" : "text-rose-400"}`}
                  >
                    {account.balanceCUPEfectivo.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-400 text-xs">CUP Transferencia</span>
                  <span
                    className={`font-bold text-sm ${account.balanceCUPTransferencia >= 0 ? "text-amber-400" : "text-rose-400"}`}
                  >
                    {account.balanceCUPTransferencia.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && (
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardBody className="py-12 text-center">
            <p className="text-zinc-500 mb-4">No tienes cuentas registradas</p>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onPress={openModal}>
              Crear Primera Cuenta
            </Button>
          </CardBody>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAccount(null);
          setFormData({ name: "", isShared: false });
        }}
        size="md"
        classNames={{
          base: "bg-zinc-900 border border-zinc-800",
          header: "border-b border-zinc-800",
        }}
      >
        <ModalContent>
          <ModalHeader>
            {editingAccount ? "Editar Cuenta" : "Nueva Cuenta"}
          </ModalHeader>
          <ModalBody className="pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre de la Cuenta"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
                classNames={{
                  input: "bg-zinc-800",
                  inputWrapper: "bg-zinc-800 border-zinc-700",
                }}
              />

              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                <span className="text-sm text-zinc-300">Cuenta Compartida</span>
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
                  onPress={() => {
                    setModalOpen(false);
                    setEditingAccount(null);
                    setFormData({ name: "", isShared: false });
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  isLoading={submitting}
                >
                  {editingAccount ? "Actualizar" : "Crear"} Cuenta
                </Button>
              </div>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}

