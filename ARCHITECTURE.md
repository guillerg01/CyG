# Arquitectura por Features/Módulos

Este proyecto está completamente organizado usando una arquitectura por features/módulos, donde cada feature contiene todos sus componentes, hooks, tipos y utilidades relacionados.

## Estructura de Carpetas

```
features/
├── expenses/          # Módulo de Gastos
│   ├── components/    # ExpenseForm
│   ├── hooks/         # useExpenses
│   ├── types/         # Expense, ExpenseFormData
│   ├── utils/         # Utilidades específicas
│   └── index.ts       # Exportaciones públicas
├── incomes/           # Módulo de Ingresos
│   ├── components/    # IncomeForm
│   ├── hooks/         # (futuro: useIncomes)
│   ├── types/         # Income, IncomeFormData
│   ├── utils/         # Utilidades específicas
│   └── index.ts
├── accounts/          # Módulo de Cuentas
│   ├── types/         # Account
│   └── index.ts
├── loans/             # Módulo de Préstamos
│   ├── types/         # Loan
│   ├── utils/         # Utilidades específicas
│   └── index.ts
├── debts/             # Módulo de Deudas
│   ├── types/         # Debt
│   ├── utils/         # Utilidades específicas
│   └── index.ts
├── conversions/       # Módulo de Conversiones
│   ├── components/    # ConversionForm
│   ├── types/         # Conversion, ConversionFormData
│   ├── utils/         # Utilidades específicas
│   └── index.ts
├── statistics/        # Módulo de Estadísticas
│   ├── types/         # Statistics
│   └── index.ts
├── transactions/      # Módulo de Transacciones
│   ├── types/         # Transaction, Change
│   └── index.ts
├── categories/        # Módulo de Categorías
│   ├── types/         # Category
│   └── index.ts
└── auth/              # Módulo de Autenticación
    ├── hooks/         # useAuth
    └── index.ts

shared/                # Código compartido entre features
├── components/        # StatCard, TransactionItem
├── hooks/             # useApi
├── types/             # Tipos compartidos (User, Account, Currency, etc.)
└── utils/             # Utilidades compartidas (formatCurrency, etc.)

lib/                   # Librerías y utilidades generales
├── prisma.ts          # Cliente de Prisma
├── auth.ts            # Utilidades de autenticación
└── utils.ts           # Re-exporta desde shared/utils (compatibilidad)

app/                   # Next.js App Router
├── api/               # API Routes (mantienen estructura por feature)
│   ├── expenses/      # Usa features/expenses/utils
│   ├── incomes/       # Usa features/incomes/utils
│   ├── loans/         # Usa features/loans/utils
│   ├── debts/         # Usa features/debts/utils
│   └── conversions/   # Usa features/conversions/utils
└── dashboard/         # Solo páginas
    ├── page.tsx
    ├── expenses/
    ├── incomes/
    └── ...
```

## Principios

1. **Encapsulación**: Cada feature contiene todo lo relacionado con su funcionalidad
2. **Reutilización**: Código compartido va en `shared/`
3. **Exportaciones**: Cada feature exporta su API pública a través de `index.ts`
4. **Imports**: Las páginas importan desde `@/features/[feature]` o `@/shared`
5. **APIs**: Las rutas API en `app/api` usan utilidades de sus respectivas features

## Ejemplo de Uso

```typescript
// Importar desde una feature
import { ExpenseForm, useExpenses, Expense } from "@/features/expenses";
import { IncomeForm, Income } from "@/features/incomes";
import { ConversionForm } from "@/features/conversions";

// Importar tipos compartidos
import { Account, Currency, User } from "@/shared/types";

// Importar componentes compartidos
import { StatCard, TransactionItem } from "@/shared/components";

// Importar hooks compartidos
import { useApi } from "@/shared/hooks";

// Importar utilidades compartidas
import { formatCurrency } from "@/shared/utils";
```

## Estructura de una Feature Completa

```
features/expenses/
├── components/
│   └── ExpenseForm.tsx      # Componente del formulario
├── hooks/
│   └── useExpenses.ts       # Hook para manejar expenses
├── types/
│   └── index.ts             # Tipos específicos (Expense, ExpenseFormData)
├── utils/
│   └── index.ts             # Utilidades específicas (re-exporta getBalanceField)
└── index.ts                 # Exporta todo públicamente
```
