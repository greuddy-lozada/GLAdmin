# Role-Based Access Control Specification

## Role Hierarchy

```typescript
// frontend/src/lib/auth/roles.ts

export const ROLE_LEVEL: Record<string, number> = {
  master:    100, // Developer / system owner — full access
  executive: 80,  // Business owners — operational + admin
  manager:   60,  // Department managers — operational CRUD
  employee:  40,  // Staff — read-mostly, limited writes
};
```

All checks use `>=` so higher levels inherit lower-level permissions.

Role slugs: `master`, `executive`, `manager`, `employee`.

## Permission Matrix

| Module | View | Create | Edit | Delete |
|---|---|---|---|---|
| **Dashboard** | ≥40 | — | — | — |
| **Suppliers** | ≥40 | ≥40 | ≥40 | 100 |
| **Customers** | ≥40 | ≥40 | ≥40 | 100 |
| **Exchange Rates** | ≥40 | ≥40 | — | — |
| **Purchase Orders** | ≥40 | ≥60 | ≥60 | 100 |
| **Withholdings** | ≥40 | ≥60 | — | 100 |
| **Products** | ≥40 | ≥60 | ≥60 | 100 |
| **Taxes** | ≥40 | ≥60 | ≥60 | 100 |
| **Batches** | ≥40 | ≥60 | ≥60 | 100 |
| **Stocks (Inventory)** | ≥40 | ≥60 | ≥60 | 100 |
| **Roles** | ≥60 | 100 | 100 | 100 |
| **Users** | ≥80 | ≥80 | ≥80 | 100 |
| **Companies** | ≥80 | ≥80 | ≥80 | 100 |
| **Settings** | ≥60 | — | — | — |

## Implementation

### 1. Role constants file

`frontend/src/lib/auth/roles.ts`:
- `ROLE_LEVEL` map
- `hasMinLevel(userRole, minLevel)` helper

### 2. `<RoleGuard>` component

`frontend/src/components/ui/role-guard.tsx`:
- Declarative wrapper, takes `minLevel` and optional `fallback`
- Reads user role from `useAuth()`

### 3. Navigation visibility

- `NavItem` uses `minLevel: number` instead of `roles: string[]`
- Layout filters sidebar items via `hasMinLevel(userRole, item.minLevel)`
- Sidebar groups are collapsible, collapsed by default
- Group headers show small icons; individual items in labeled groups are text-only

### 4. Frontend button visibility

| Page | Create | Edit | Delete |
|---|---|---|---|
| `purchase-orders-page.tsx` | minLevel=60 | minLevel=60 | minLevel=100 |
| `withholdings-page.tsx` | minLevel=60 | — | minLevel=100 |
| `products-page.tsx` | minLevel=60 | minLevel=60 | minLevel=100 |
| `taxes-page.tsx` | minLevel=60 | minLevel=60 | minLevel=100 |
| `batches-page.tsx` | minLevel=60 | minLevel=60 | minLevel=100 |
| `stocks-page.tsx` | minLevel=60 | minLevel=60 | minLevel=100 |
| `exchange-rates-page.tsx` | minLevel=40 | — | — |
| `suppliers-page.tsx` | minLevel=40 | minLevel=40 | minLevel=100 |
| `customers-page.tsx` | minLevel=40 | minLevel=40 | minLevel=100 |
| `users-page.tsx` | minLevel=80 | minLevel=80 | minLevel=100 |
| `companies-page.tsx` | minLevel=80 | minLevel=80 | minLevel=100 |
| `roles-page.tsx` | — (no action buttons) | — | — |

Implementation approach:
- Create button wrapped with `<RoleGuard minLevel={N}>`
- DataTable `onEdit` / `onDelete` passed conditionally (undefined = no button shown)

### 5. Navigation groups

| Group | Nav items | minLevel |
|---|---|---|
| (none) | Dashboard | 40 |
| Compras | Suppliers, Purchase Orders, Withholdings, Exchange Rates | 40 |
| Ventas | Customers | 40 |
| Inventario | Products, Taxes, Batches, Stocks | 40 |
| Admin | Users (80), Companies (80), Roles (60) | 60–80 |
| Config | Settings | 60 |

### 6. Backend roles controller

`GET /roles` allows `master`, `executive`, `manager` (not employee).

### 7. Backend decorator

✅ `@MinLevel(N)` decorator implemented at `backend/src/common/decorators/min-level.decorator.ts`. `RolesGuard` updated to check `@MinLevel()` first, falling back to `@Roles()` strings. Both still work.
