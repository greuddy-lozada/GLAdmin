# Architecture — Reglas de Arquitectura

> **status:** `current` · Última verificación: 2026-08-08  
> **Principio rector:** Cuadra usa **Vertical Slicing**. Cada feature es un módulo autocontenido que abarca desde la UI hasta la base de datos.  
> No existen capas horizontales compartidas que acoplen features entre sí.

---

## 1. Vertical Slicing — Estructura de Módulos

### Backend (NestJS)

El código vive en `backend/src/modules/` (no `features/`). Utilidades transversales: `common/` y `shared/`.

```
backend/src/
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── dto/
│   ├── products/
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── dto/
│   │       ├── create-product.dto.ts
│   │       └── update-product.dto.ts
│   ├── sales/                 # Ventas (no "invoices")
│   ├── purchase-orders/
│   ├── stocks/
│   ├── sync/
│   └── ...
├── common/                    # Guards, decorators, filters, pipes, DTOs transversales
├── shared/                    # PrismaService, CacheService, etc.
└── prisma/                    # (en backend/prisma/) schema + migrations
```

### Frontend (Next.js App Router)

```
frontend/src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── models/
│   │   └── services/
│   ├── products/
│   │   ├── components/
│   │   │   └── products-page.tsx
│   │   ├── hooks/
│   │   │   └── use-products.ts
│   │   ├── models/
│   │   │   └── product.model.ts
│   │   └── services/
│   │       └── product.service.ts   # singular del entity
│   └── ...
├── components/                # Componentes compartidos (ui/)
│   └── ui/                    # shadcn/ui components
├── hooks/                     # Hooks genéricos (useHotkey, etc.)
├── i18n/                      # Traducciones
└── config/                    # Configuración global (navigation, shortcuts)
```

### Reglas del Vertical Slicing

1. **Un módulo NO importa directamente el service de otro módulo.** Para comunicación cross-module, usar:
   - Eventos del bus interno de NestJS (`@nestjs/event-emitter`).
   - Endpoints REST (el módulo A llama a la API del módulo B).
2. **Cada módulo tiene su propio `dto/`** — no existen DTOs "compartidos" entre features de negocio.
3. **Prisma Client es el único punto de acceso a BD permitido** (vía `PrismaService` en `shared/`).
4. **Prisma unifica migraciones** en un solo árbol bajo `backend/prisma/migrations/`.
5. **Contratos de dominio** viven en [.spec/features/](../features/) — leer la feature spec antes de cambiar reglas de negocio.

---

## 2. Convenciones de Nombres

### NestJS (Backend)

| Elemento | Convención | Ejemplo |
|---|---|---|
| Módulo | `{feature}.module.ts` | `products.module.ts`, `sales.module.ts` |
| Controlador | `{feature}.controller.ts` | `products.controller.ts` |
| Servicio | `{feature}.service.ts` | `products.service.ts` |
| DTO | `{verbo}-{feature}.dto.ts` | `create-product.dto.ts`, `update-product.dto.ts` |
| Guard | `{nombre}.guard.ts` | `plan-level.guard.ts` |
| Decorator | `{nombre}.decorator.ts` | `min-level.decorator.ts` |

#### Nombres de endpoints REST

```
GET    /api/{feature}           → findAll(query?: QueryDto)
GET    /api/{feature}/:id       → findOne(id: string)          # UUID
POST   /api/{feature}           → create(dto: CreateDto)
PATCH  /api/{feature}/:id       → update(id: string, dto: UpdateDto)   ← NUNCA PUT
DELETE /api/{feature}/:id       → remove(id: string)                   ← Soft-delete / desactivación, NUNCA DELETE físico de filas con historial
```

### Next.js (Frontend)

| Elemento | Convención | Ejemplo |
|---|---|---|
| Feature page | `{feature}-page.tsx` | `products-page.tsx` |
| Hook | `use-{feature}.ts` | `use-products.ts` |
| Model | `{entity}.model.ts` | `product.model.ts` |
| Service | `{entity}.service.ts` | `product.service.ts` |
| Componente UI | `{nombre}.tsx` (kebab-case) | `confirm-dialog.tsx`, `slide-form.tsx` |

---

## 3. Desacoplamiento Framework-Negocio

### Reglas estrictas

1. **La lógica de negocio NUNCA vive en controladores.**  
   - Controlador: recibe HTTP request → valida → llama al service → retorna HTTP response.  
   - Service: contiene la lógica de negocio pura, sin referencias a `@Req()`, `@Res()`, `Request`, `Response`.

2. **Los servicios de NestJS NO deben conocer detalles de HTTP.**  
   ```typescript
   // ❌ MAL: servicio acoplado a HTTP
   @Injectable()
   export class SalesService {
     create(@Req() req: Request, dto: CreateSaleDto) { ... }
   }
   
   // ✅ BIEN: servicio puro, solo lógica de negocio
   @Injectable()
   export class SalesService {
     create(userId: string, dto: CreateSaleDto) { ... }
   }
   ```

3. **En el frontend, los `service.ts` son la única capa que llama a `fetch`/`axios`.**  
   Los hooks y componentes no deben hacer llamadas HTTP del CRUD principal.  
   *(Deuda conocida: algunos forms aún cargan catálogos auxiliares vía `apiClient` — migrar a services del feature dueño.)*

4. **Validación de reglas de negocio vive en el backend (NestJS + class-validator).**  
   El frontend puede tener validación duplicada (Zod) para UX inmediata, pero la fuente de verdad es el backend.

---

## 4. Módulos Core del Sistema

| Módulo (backend `modules/`) | Descripción | Dependencias típicas |
|---|---|---|
| `auth` | Login, registro, JWT, refresh tokens | — |
| `users` / `roles` | Usuarios y roles org/system | `auth` |
| `companies` | Datos fiscales de la empresa (RIF, razón social) | tenant |
| `products` | Catálogo (precios, tax/brand/category) | `taxes`, `brands`, `categories` |
| `categories` / `brands` / `taxes` | Taxonomía del catálogo | `products` |
| `customers` | Clientes | tenant |
| `suppliers` / `purchase-orders` | Compras | `products`, `suppliers` |
| `stocks` / `batches` | Inventario y lotes | `products` |
| `sales` | Ventas / documentos de cobro (no módulo `invoices`) | `products`, `customers` |
| POS (frontend `features/pos`) | Caja rápida offline-first | `products`, `customers`, `sales`, `sync` |
| `cash-register` | Apertura/cierre de caja | `sales` |
| `exchange-rates` / `currencies` | Multi-moneda VES/USD | tenant |
| `pago-movil` / `payments` / `subscriptions` | Cobros y planes | billing |
| `reports` / `dashboard` | Reportes y KPIs | `sales`, `products` |
| `sync` | Sync offline ↔ servidor | catálogo + ventas |
| `admin` | Panel system (orgs, plans, invites) | `auth` system roles |

Contratos detallados: [.spec/features/](../features/).

---

*Referencia cruzada: [database.md](database.md) — [security.md](security.md) — [features/products.md](../features/products.md)*
