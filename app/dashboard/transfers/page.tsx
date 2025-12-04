"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { IconArrowsExchange } from "@tabler/icons-react";
import { Account } from "@/shared/types";
import { formatCurrency, getCurrencyLabel } from "@/shared/utils";
import { TransferForm, TransferFormData } from "@/features/transfers";

interface Transfer {
  id: string;
  amount: number;
  description: string | null;
  currency: string;
  createdAt: string;
  fromAccount: Account;
  toAccount: Account;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [transfersRes, accountsRes] = await Promise.all([
        fetch("/api/transfers"),
        fetch("/api/accounts"),
      ]);

      if (transfersRes.ok) {
        setTransfers(await transfersRes.json());
      }
      if (accountsRes.ok) {
        setAccounts(await accountsRes.json());
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

  const handleSubmit = async (data: TransferFormData) => {
    try {
      const response = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <IconArrowsExchange className="w-6 h-6" />
            Transferencias
          </h1>
          <p className="text-zinc-400 text-sm">
            Historial de transferencias entre cuentas
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onPress={() => setModalOpen(true)}
        >
          Nueva Transferencia
        </Button>
      </div>

      <Card className="bg-zinc-900 border border-zinc-800">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Historial de Transferencias</h2>
        </CardHeader>
        <CardBody>
          {transfers.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">No hay transferencias registradas</p>
          ) : (
            <Table aria-label="Transferencias">
              <TableHeader>
                <TableColumn>Fecha</TableColumn>
                <TableColumn>Usuario</TableColumn>
                <TableColumn>Desde</TableColumn>
                <TableColumn>Hacia</TableColumn>
                <TableColumn>Moneda</TableColumn>
                <TableColumn>Monto</TableColumn>
                <TableColumn>Descripción</TableColumn>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      {new Date(transfer.createdAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>{transfer.user.name}</TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" className="bg-rose-500/20 text-rose-400">
                        {transfer.fromAccount.name}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" className="bg-emerald-500/20 text-emerald-400">
                        {transfer.toAccount.name}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {getCurrencyLabel(transfer.currency as any)}
                      </Chip>
                    </TableCell>
                    <TableCell className="font-semibold">
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

      {modalOpen && (
        <TransferForm
          accounts={accounts}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

