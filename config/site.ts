export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "CyG Finance",
  description: "Sistema de control financiero personal y compartido",
  navItems: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Gastos", href: "/dashboard/expenses" },
    { label: "Ingresos", href: "/dashboard/incomes" },
    { label: "Cuentas", href: "/dashboard/accounts" },
    { label: "Estadisticas", href: "/dashboard/statistics" },
  ],
  navMenuItems: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Gastos", href: "/dashboard/expenses" },
    { label: "Ingresos", href: "/dashboard/incomes" },
    { label: "Cuentas", href: "/dashboard/accounts" },
    { label: "Prestamos", href: "/dashboard/loans" },
    { label: "Deudas", href: "/dashboard/debts" },
    { label: "Estadisticas", href: "/dashboard/statistics" },
    { label: "Historial", href: "/dashboard/transactions" },
    { label: "Configuracion", href: "/dashboard/settings" },
  ],
};
