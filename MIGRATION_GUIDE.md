# Guía de Migración a Arquitectura por Features

## Cambios Realizados

### ✅ Estructura Creada

- ✅ Carpeta `features/` con todas las features organizadas
- ✅ Carpeta `shared/` para código compartido
- ✅ Tipos compartidos movidos a `shared/types/`
- ✅ Componentes compartidos movidos a `shared/components/`

### ✅ Features Completadas

- ✅ `features/expenses/` - Componentes, hooks, tipos
- ✅ `features/incomes/` - Componentes, tipos
- ✅ `features/conversions/` - Componentes, tipos

### ⏳ Pendiente de Actualizar

- ⏳ Actualizar imports en todas las páginas del dashboard
- ⏳ Crear hooks para las demás features (accounts, loans, debts, etc.)
- ⏳ Mover tipos restantes a sus respectivas features

## Cómo Actualizar los Imports

### Antes:

```typescript
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { Expense } from "@/types";
import { StatCard } from "@/components/ui/StatCard";
```

### Después:

```typescript
import { ExpenseForm, Expense } from "@/features/expenses";
import { StatCard } from "@/shared/components";
import { Account, Currency } from "@/shared/types";
```

## Archivos que Necesitan Actualización

1. **app/dashboard/expenses/page.tsx** - ✅ Parcialmente actualizado
2. **app/dashboard/incomes/page.tsx** - ⏳ Pendiente
3. **app/dashboard/page.tsx** - ⏳ Pendiente
4. **app/dashboard/accounts/page.tsx** - ⏳ Pendiente
5. **app/dashboard/loans/page.tsx** - ⏳ Pendiente
6. **app/dashboard/debts/page.tsx** - ⏳ Pendiente
7. **app/dashboard/statistics/page.tsx** - ⏳ Pendiente
8. **app/dashboard/transactions/page.tsx** - ⏳ Pendiente

## Próximos Pasos

1. Actualizar imports en todas las páginas
2. Crear hooks para cada feature (useAccounts, useLoans, etc.)
3. Mover tipos específicos a cada feature
4. Actualizar tipos compartidos en `shared/types/`
