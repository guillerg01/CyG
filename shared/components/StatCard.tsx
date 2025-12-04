"use client";

import { Card, CardBody } from "@heroui/card";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantStyles = {
  default: "bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700",
  success:
    "bg-gradient-to-br from-emerald-900/50 to-emerald-950 border-emerald-700/50",
  warning:
    "bg-gradient-to-br from-amber-900/50 to-amber-950 border-amber-700/50",
  danger: "bg-gradient-to-br from-rose-900/50 to-rose-950 border-rose-700/50",
};

const valueStyles = {
  default: "text-white",
  success: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-rose-400",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
}: StatCardProps) {
  return (
    <Card className={`border ${variantStyles[variant]}`}>
      <CardBody className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-zinc-400 text-sm font-medium mb-1">{title}</p>
            <p className={`text-2xl font-bold ${valueStyles[variant]}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-zinc-500 text-xs mt-1">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={`text-xs font-medium ${trend >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {trend >= 0 ? "+" : ""}
                  {trend.toFixed(1)}%
                </span>
                <span className="text-zinc-500 text-xs">vs last month</span>
              </div>
            )}
          </div>
          {icon && <div className="p-2 rounded-lg bg-zinc-800/50">{icon}</div>}
        </div>
      </CardBody>
    </Card>
  );
}
