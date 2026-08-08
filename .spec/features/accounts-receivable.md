# Feature: Accounts Receivable (CXC)

> **status:** `current`  
> **owner:** cobranza / ventas  
> **last-verified:** 2026-08-08  
> **code:** `backend/src/modules/accounts-receivable/` · `frontend/src/features/accounts-receivable/`  
> **Related:** [pos.md](pos.md) · [sales.md](sales.md) · [accounts-payable.md](accounts-payable.md)

Cobranza de ventas a crédito (fiado) en Venezuela.

---

## 1. Purpose / Non-goals

### Purpose

Abrir CXC al vender a crédito, listar saldos, registrar abonos (`credit` += monto). Balance = `amount - credit`.

### Non-goals

- No ledger de abonos (v1 solo incrementa `credit`).
- No límites de crédito por cliente, intereses ni cuotas.
- No crear CXC manual sin venta.

---

## 2. Domain

Prisma `AccountsReceivable`: `idSale`, `amount`, `credit`, `issueDate`, `dueDate` (default +30d), `status` (0 open / 1 paid), `organizationId`.

Creación: `SalesService.create` cuando unpaid = `sale.amount - sum(non-credit payments)` > 0 (incluye `PaymentMethod.Credit = 6`).

---

## 3. API

Base: `/api/accounts-receivable`  
Plan: `professional` · RBAC: employee+

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Paginated; filters `status=open\|paid\|overdue` |
| GET | `/:id` | Detail + customer/sale |
| POST | `/:id/payments` | `{ amount }` → increment `credit`; paid when balance ≤ 0 |

---

## 4. UI

Nav Ventas → CXC. DataTable + abono dialog. i18n `accountsReceivable.*`.

---

## 5. DoD

- [x] Spec  
- [x] Credit sale creates AR  
- [x] List + abono  
- [x] Dashboard CXC reflects open balances  
