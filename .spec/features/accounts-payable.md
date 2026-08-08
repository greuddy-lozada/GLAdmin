# Feature: Accounts Payable (CXP)

> **status:** `current`  
> **owner:** compras / pagos  
> **last-verified:** 2026-08-08  
> **code:** `backend/src/modules/accounts-payable/` · `frontend/src/features/accounts-payable/`  
> **Related:** purchase-orders · [accounts-receivable.md](accounts-receivable.md)

Cuentas por pagar a proveedores al recibir mercancía.

---

## 1. Purpose / Non-goals

### Purpose

Abrir CXP cuando un PO pasa a `RECEIVED`, listar saldos, registrar abonos. Balance = `amount - credit`.

### Non-goals

- No ledger de pagos v1.  
- No CXP manual sin PO.  
- No partial-receive AP (solo al recibir completo).

---

## 2. Domain

Prisma `AccountsPayable`: `idPurchaseOrder`, `amount`, `credit`, `issueDate`, `dueDate` (+30d), `status` (0 open / 1 paid).

Creación idempotente en `PurchaseOrdersService.receive` al set `RECEIVED`.

---

## 3. API

Base: `/api/accounts-payable`  
Plan: `professional` · RBAC: employee+

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Paginated; `status=open\|paid\|overdue` |
| GET | `/:id` | + supplier / PO |
| POST | `/:id/payments` | `{ amount }` → `credit` += |

---

## 4. UI

Nav Compras → CXP. DataTable + abono dialog. i18n `accountsPayable.*`.

---

## 5. DoD

- [x] Spec  
- [x] PO RECEIVED creates AP  
- [x] List + abono  
