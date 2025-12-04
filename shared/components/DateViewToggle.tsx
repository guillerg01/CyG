"use client";

import { Switch } from "@heroui/switch";
import { Card } from "@heroui/card";

interface DateViewToggleProps {
  isCurrentMonth: boolean;
  onToggle: (isCurrentMonth: boolean) => void;
  className?: string;
}

export function DateViewToggle({
  isCurrentMonth,
  onToggle,
  className = "",
}: DateViewToggleProps) {
  return (
    <Card className={`bg-zinc-900 border border-zinc-800 ${className}`}>
      <div className="p-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-white font-medium text-sm">
            Vista de Datos
          </span>
          <span className="text-zinc-400 text-xs">
            {isCurrentMonth ? "Mostrando mes actual" : "Mostrando todos los meses"}
          </span>
        </div>
        <Switch
          isSelected={isCurrentMonth}
          onValueChange={onToggle}
          classNames={{
            base: "max-w-fit",
            wrapper: "bg-zinc-700 group-data-[selected=true]:bg-emerald-600",
          }}
        >
          <span className="text-white text-sm">
            {isCurrentMonth ? "Mes Actual" : "General"}
          </span>
        </Switch>
      </div>
    </Card>
  );
}

