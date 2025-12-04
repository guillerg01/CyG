"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { IconCurrencyDollar, IconLock } from "@tabler/icons-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || "Error al restablecer la contrasena");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

      <Card className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800">
        <CardHeader className="flex flex-col gap-1 items-center pt-8 pb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mb-4">
            <IconLock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Restablecer Contrasena
          </h1>
          <p className="text-zinc-400 text-sm">
            Ingresa tu email y nueva contrasena
          </p>
        </CardHeader>

        <CardBody className="px-8 pb-8">
          {success ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-emerald-400 text-sm text-center">
                  Contrasena restablecida exitosamente. Redirigiendo al login...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <p className="text-rose-400 text-sm text-center">{error}</p>
                </div>
              )}

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isRequired
                classNames={{
                  input: "bg-zinc-800",
                  inputWrapper:
                    "bg-zinc-800/50 border-zinc-700 hover:border-emerald-500/50",
                }}
              />

              <Input
                label="Nueva Contrasena"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                isRequired
                classNames={{
                  input: "bg-zinc-800",
                  inputWrapper:
                    "bg-zinc-800/50 border-zinc-700 hover:border-emerald-500/50",
                }}
              />

              <Input
                label="Confirmar Contrasena"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                isRequired
                classNames={{
                  input: "bg-zinc-800",
                  inputWrapper:
                    "bg-zinc-800/50 border-zinc-700 hover:border-emerald-500/50",
                }}
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold py-6"
                isLoading={loading}
              >
                Restablecer Contrasena
              </Button>

              <p className="text-center text-zinc-400 text-sm">
                <Link
                  href="/login"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Volver al login
                </Link>
              </p>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
