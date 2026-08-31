# Multi-tenancy — Aislamiento por Organización

> **status:** `current` · last-verified: 2026-08-08  
> **code:** `backend/src/modules/tenant/` · `ContextService` · Prisma extension en `shared/prisma/prisma.service.ts`

---

## 1. Modelo

- Toda entidad de negocio pertenece a una **`Organization`** vía `organizationId`.
- El request lleva contexto de org en AsyncLocalStorage (`ContextService`).
- Frontend envía org activa (JWT `orgId` / header `x-organization-id` / cookie `organization_id` — ver middleware).

---

## 2. TenantMiddleware

1. Resuelve organización del usuario autenticado.
2. Valida membership si hay header/cookie de org.
3. Carga plan + features (cache ~600s) en el contexto.
4. Super-admin / master puede operar sin filtro de org en algunos paths admin.

---

## 3. Prisma extension (reglas)

Para modelos en la lista **businessModels**:

- **create:** inyecta `organizationId` del contexto si falta.
- **find/update/delete where:** añade `organizationId` del contexto.
- **Skip filter** si: no hay contexto, superAdmin, o sin `organizationId`.
- **User** no se filtra por org en la extension (membership es tabla puente).
- **Invite** no se filtra por org: el panel `/admin/invites` lista invitaciones de todas las orgs; Auth las reclama por `code` único. El alta sí persiste `organizationId` del DTO.

Soft-delete (`deletedAt: null` en reads; `delete` → update `deletedAt`) aplica a `softDeleteModels` (incluye Product, Sale, Customer, …).

### Modelos / casos sin auto-filtro org (cuidado)

Ejemplos: `Brand` / `Category` pueden tener soft-delete sin estar en `businessModels`; `Invite`, `SalePayment`, `SyncConflict`, `AuditLog`, `RefreshToken`, `Plan`, etc. — **verificar** antes de asumir aislamiento automático. Si un query nuevo toca datos de negocio, debe estar en businessModels o filtrar a mano.

---

## 4. Invariants

1. Nunca listar/mutar filas de otra org en endpoints orgánicos.
2. Seeds y admin panel usan paths explícitos (`admin/*`) con `@MinLevel` system.
3. Cache de plan por org debe invalidarse al cambiar suscripción.

---

## 5. Anti-patterns

- `findMany` sin where en services de negocio fuera de la extension.
- Confiar en el cliente para `organizationId` en el body (el server debe imponer contexto).
- Logs con PII cross-tenant.

---

*Refs: [security.md](security.md) · [plan-gating.md](plan-gating.md) · [architecture.md](architecture.md)*
