"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import {
  IconHome,
  IconArrowDown,
  IconArrowUp,
  IconWallet,
  IconArrowsExchange,
  IconCreditCard,
  IconChartBar,
  IconClock,
  IconMenu2,
  IconCurrencyDollar,
  IconSettings,
  IconLogout,
} from "@tabler/icons-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "home" },
  { name: "Gastos", href: "/dashboard/expenses", icon: "expense" },
  { name: "Ingresos", href: "/dashboard/incomes", icon: "income" },
  { name: "Cuentas", href: "/dashboard/accounts", icon: "wallet" },
  { name: "Prestamos", href: "/dashboard/loans", icon: "loan" },
  { name: "Deudas", href: "/dashboard/debts", icon: "debt" },
  { name: "Estadisticas", href: "/dashboard/statistics", icon: "chart" },
  { name: "Historial", href: "/dashboard/transactions", icon: "history" },
];

const icons: Record<string, React.ReactNode> = {
  home: <IconHome className="w-5 h-5" />,
  expense: <IconArrowDown className="w-5 h-5" />,
  income: <IconArrowUp className="w-5 h-5" />,
  wallet: <IconWallet className="w-5 h-5" />,
  loan: <IconArrowsExchange className="w-5 h-5" />,
  debt: <IconCreditCard className="w-5 h-5" />,
  chart: <IconChartBar className="w-5 h-5" />,
  history: <IconClock className="w-5 h-5" />,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && pathname === "/dashboard") {
      router.replace("/dashboard/quick");
    }
  }, [isMobile, pathname, router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (pathname === "/dashboard/quick") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <Button
          isIconOnly
          variant="flat"
          size="sm"
          onPress={() => setSidebarOpen(!sidebarOpen)}
        >
          <IconMenu2 className="w-5 h-5" />
        </Button>
        <span className="text-white font-semibold">CyG Finance</span>
        <div className="w-8" />
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <IconCurrencyDollar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold">CyG Finance</h1>
                <p className="text-zinc-500 text-xs">Control Financiero</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  {icons[item.icon]}
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-zinc-800">
            <Dropdown>
              <DropdownTrigger>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors">
                  <Avatar size="sm" className="bg-emerald-500/20" name="U" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      Usuario
                    </p>
                    <p className="text-zinc-500 text-xs truncate">
                      Configuracion
                    </p>
                  </div>
                </div>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem
                  key="settings"
                  href="/dashboard/settings"
                  startContent={<IconSettings className="w-4 h-4" />}
                >
                  Configuracion
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  className="text-danger"
                  color="danger"
                  onPress={handleLogout}
                  startContent={<IconLogout className="w-4 h-4" />}
                >
                  Cerrar Sesion
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
