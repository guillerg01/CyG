"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { User, Category } from "@/shared/types";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "",
    incomePercentage: 50,
    monthlyIncomeUSD: 0,
    monthlyIncomeUSDT: 0,
    monthlyIncomeCUP: 0,
  });
  const [sharedAccounts, setSharedAccounts] = useState<any[]>([]);

  const [pinData, setPinData] = useState({
    pin: "",
    confirmPin: "",
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "#10b981",
  });

  const fetchData = useCallback(async () => {
    try {
      const [userRes, categoriesRes, accountsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/categories"),
        fetch("/api/accounts"),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
        setProfileData({
          name: userData.name,
          incomePercentage: userData.incomePercentage || 50,
          monthlyIncomeUSD: userData.monthlyIncomeUSD || 0,
          monthlyIncomeUSDT: userData.monthlyIncomeUSDT || 0,
          monthlyIncomeCUP: userData.monthlyIncomeCUP || 0,
        });
      }
      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json());
      }
      if (accountsRes.ok) {
        const accounts = await accountsRes.json();
        // Filtrar solo cuentas compartidas
        const shared = accounts.filter((acc: any) => acc.isShared);
        setSharedAccounts(shared);
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePinUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinData.pin !== pinData.confirmPin) {
      return;
    }

    setSubmitting(true);
    try {
      await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinData.pin }),
      });
      setPinData({ pin: "", confirmPin: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategoryCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });

      if (response.ok) {
        setCategoryModalOpen(false);
        setNewCategory({ name: "", color: "#10b981" });
        fetchData();
      }
    } finally {
      setSubmitting(false);
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
      <div>
        <h1 className="text-2xl font-bold text-white">Configuracion</h1>
        <p className="text-zinc-400 text-sm">Administra tu perfil y preferencias</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border border-zinc-800">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Perfil</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <Input
                label="Nombre"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
                classNames={{
                  input: "bg-zinc-800",
                  inputWrapper: "bg-zinc-800 border-zinc-700",
                }}
              />

              <Input
                label="Email"
                value={user?.email || ""}
                isReadOnly
                classNames={{
                  input: "bg-zinc-800",
                  inputWrapper: "bg-zinc-800 border-zinc-700",
                }}
              />

              <Input
                label="Porcentaje de Contribucion (%)"
                type="number"
                min={0}
                max={100}
                value={profileData.incomePercentage.toString()}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    incomePercentage: parseInt(e.target.value) || 0,
                  })
                }
                description="Porcentaje que contribuyes a los gastos compartidos del hogar"
                classNames={{
                  input: "bg-zinc-800",
                  inputWrapper: "bg-zinc-800 border-zinc-700",
                }}
              />

              <div className="space-y-2">
                <p className="text-sm text-zinc-400">Ingresos Mensuales Configurados</p>
                <Input
                  label="Ingreso Mensual USD"
                  type="number"
                  min={0}
                  step="0.01"
                  value={profileData.monthlyIncomeUSD.toString()}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      monthlyIncomeUSD: parseFloat(e.target.value) || 0,
                    })
                  }
                  description="Ingreso mensual en USD para calcular proporciones de gastos compartidos"
                  classNames={{
                    input: "bg-zinc-800",
                    inputWrapper: "bg-zinc-800 border-zinc-700",
                  }}
                />
                <Input
                  label="Ingreso Mensual USDT"
                  type="number"
                  min={0}
                  step="0.01"
                  value={profileData.monthlyIncomeUSDT.toString()}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      monthlyIncomeUSDT: parseFloat(e.target.value) || 0,
                    })
                  }
                  classNames={{
                    input: "bg-zinc-800",
                    inputWrapper: "bg-zinc-800 border-zinc-700",
                  }}
                />
                <Input
                  label="Ingreso Mensual CUP"
                  type="number"
                  min={0}
                  step="0.01"
                  value={profileData.monthlyIncomeCUP.toString()}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      monthlyIncomeCUP: parseFloat(e.target.value) || 0,
                    })
                  }
                  classNames={{
                    input: "bg-zinc-800",
                    inputWrapper: "bg-zinc-800 border-zinc-700",
                  }}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                isLoading={submitting}
              >
                Guardar Cambios
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card className="bg-zinc-900 border border-zinc-800">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Cuentas Compartidas</h2>
          </CardHeader>
          <CardBody>
            {sharedAccounts.length > 0 ? (
              <div className="space-y-3">
                {sharedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                  >
                    <p className="text-white font-medium">{account.name}</p>
                    {account.users && account.users.length > 0 && (
                      <p className="text-zinc-400 text-sm mt-1">
                        Compartes con: {account.users
                          .filter((ua: any) => ua.user.id !== user?.id)
                          .map((ua: any) => ua.user.name)
                          .join(", ") || "Nadie"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-4">
                No tienes cuentas compartidas
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="bg-zinc-900 border border-zinc-800">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Seguridad - PIN</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handlePinUpdate} className="space-y-4">
              <Input
                label="Nuevo PIN (4 digitos)"
                type="password"
                maxLength={4}
                value={pinData.pin}
                onChange={(e) =>
                  setPinData({ ...pinData, pin: e.target.value.replace(/\D/g, "") })
                }
                classNames={{
                  input: "bg-zinc-800",
                  inputWrapper: "bg-zinc-800 border-zinc-700",
                }}
              />

              <Input
                label="Confirmar PIN"
                type="password"
                maxLength={4}
                value={pinData.confirmPin}
                onChange={(e) =>
                  setPinData({
                    ...pinData,
                    confirmPin: e.target.value.replace(/\D/g, ""),
                  })
                }
                isInvalid={
                  pinData.confirmPin.length > 0 && pinData.pin !== pinData.confirmPin
                }
                errorMessage="Los PINs no coinciden"
                classNames={{
                  input: "bg-zinc-800",
                  inputWrapper: "bg-zinc-800 border-zinc-700",
                }}
              />

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                isLoading={submitting}
                isDisabled={
                  pinData.pin.length !== 4 || pinData.pin !== pinData.confirmPin
                }
              >
                Actualizar PIN
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>

      <Card className="bg-zinc-900 border border-zinc-800">
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Categorias</h2>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onPress={() => setCategoryModalOpen(true)}
          >
            + Nueva Categoria
          </Button>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-center"
              >
                <div
                  className="w-8 h-8 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: category.color || "#10b981" }}
                />
                <p className="text-white text-sm font-medium truncate">
                  {category.name}
                </p>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <p className="text-zinc-500 text-center py-8">
              No hay categorias. Crea una para comenzar.
            </p>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        size="md"
        classNames={{
          base: "bg-zinc-900 border border-zinc-800",
          header: "border-b border-zinc-800",
        }}
      >
        <ModalContent>
          <ModalHeader>Nueva Categoria</ModalHeader>
          <ModalBody className="pb-6">
            <form onSubmit={handleCategoryCreate} className="space-y-4">
              <Input
                label="Nombre"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                isRequired
                classNames={{
                  input: "bg-zinc-800",
                  inputWrapper: "bg-zinc-800 border-zinc-700",
                }}
              />

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    "#10b981",
                    "#3b82f6",
                    "#f59e0b",
                    "#ef4444",
                    "#8b5cf6",
                    "#ec4899",
                    "#06b6d4",
                    "#84cc16",
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full transition-transform ${newCategory.color === color ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCategory({ ...newCategory, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="flat"
                  className="flex-1"
                  onPress={() => setCategoryModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  isLoading={submitting}
                >
                  Crear Categoria
                </Button>
              </div>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}

