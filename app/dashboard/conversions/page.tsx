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
import { IconCurrencyDollar } from "@tabler/icons-react";
import { Account } from "@/shared/types";
import { formatCurrency, getCurrencyLabel } from "@/shared/utils";
import { ConversionForm, ConversionFormData } from "@/features/conversions";

interface Conversion {
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
}

export default function ConversionsPage() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [conversionsRes, accountsRes] = await Promise.all([
        fetch("/api/conversions"),
        fetch("/api/accounts"),
      ]);

      if (conversionsRes.ok) {
        setConversions(await conversionsRes.json());
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

  const handleSubmit = async (data: ConversionFormData) => {
    try {
      const response = await fetch("/api/conversions", {
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
            <IconCurrencyDollar className="w-6 h-6" />
            Conversiones
          </h1>
          <p className="text-zinc-400 text-sm">
            Historial de conversiones de moneda
          </p>
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-700"
          onPress={() => setModalOpen(true)}
        >
          Nueva Conversión
        </Button>
      </div>

      <Card className="bg-zinc-900 border border-zinc-800">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Historial de Conversiones</h2>
        </CardHeader>
        <CardBody>
          {conversions.length === 0 ? (
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
                {conversions.map((conversion) => (
                  <TableRow key={conversion.id}>
                    <TableCell>
                      {new Date(conversion.createdAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
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

      {modalOpen && (
        <ConversionForm
          accounts={accounts}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

