# Architecture — Reglas de Arquitectura

> **Principio rector:** Cuadra usa **Vertical Slicing**. Cada feature es un módulo autocontenido que abarca desde la UI hasta la base de datos.  
> No existen capas horizontales compartidas que acoplen features entre sí.

---

## 1. Vertical Slicing — Estructura de Módulos

### Backend (NestJS)

```
backend/src/
├── features/
│   ├── auth/                  # Módulo de autenticación
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   ├── products/              # Módulo de productos
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── dto/
│   │       ├── create-product.dto.ts
│   │       └── update-product.dto.ts
│   ├── invoices/              # Módulo de facturación
│   │   ├── invoices.module.ts
│   │   ├── invoices.controller.ts
│   │   ├── invoices.service.ts
│   │   └── dto/
│   │       ├── create-invoice.dto.ts
│   │       └── invoice-query.dto.ts
│   └── ...
├── common/                    # Utilidades transversales (solo si son genéricas)
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   └── roles.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── pipes/
│       └── validation.pipe.ts
└── prisma/
    ├── schema.prisma
    └── migrations/
```

### Frontend (Next.js App Router)

```
frontend/src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   └── login-form.tsx
│   │   ├── hooks/
│   │   │   └── use-auth.ts
│   │   ├── models/
│   │   │   └── auth.model.ts
│   │   └── services/
│   │       └── auth.service.ts
│   ├── products/
│   │   ├── components/
│   │   │   └── products-page.tsx
│   │   ├── hooks/
│   │   │   └── use-products.ts
│   │   ├── models/
│   │   │   └── product.model.ts
│   │   └── services/
│   │       └── products.service.ts
│   └── ...
├── components/                # Componentes compartidos (ui/)
│   └── ui/                    # shadcn/ui components
├── hooks/                     # Hooks genéricos (useHotkey, etc.)
├── i18n/                      # Traducciones
└── config/                    # Configuración global
```

### Reglas del Vertical Slicing

1. **Un módulo NO importa directamente el service de otro módulo.** Para comunicación cross-module, usar:
   - Eventos del bus interno de NestJS (`@nestjs/event-emitter`).
   - Endpoints REST (el módulo A llama a la API del módulo B).
2. **Cada módulo tiene su propio `dto/`** — no existen DTOs "compartidos" entre features.
3. **Prisma Client es el único punto de acceso a BD permitido.** No se usan raw queries fuera de `prisma/*.service.ts` internos de cada feature.
4. **Cada feature es dueña de sus propias migraciones conceptuales** (aunque Prisma las unifica en un solo árbol de migraciones).

---

## 2. Convenciones de Nombres

### NestJS (Backend)

| Elemento | Convención | Ejemplo |
|---|---|---|
| Módulo | `{feature}.module.ts` | `invoices.module.ts` |
| Controlador | `{feature}.controller.ts` | `invoices.controller.ts` |
| Servicio | `{feature}.service.ts` | `invoices.service.ts` |
| DTO | `{verbo}-{feature}.dto.ts` | `create-invoice.dto.ts`, `update-invoice.dto.ts` |
| Guard | `{nombre}.guard.ts` | `roles.guard.ts` |
| Decorator | `{nombre}.decorator.ts` | `roles.decorator.ts` |
| Pipe | `{nombre}.pipe.ts` | `validation.pipe.ts` |
| Filter | `{nombre}.filter.ts` | `http-exception.filter.ts` |

#### Nombres de endpoints REST

```
GET    /api/{feature}           → findAll(query?: QueryDto)
GET    /api/{feature}/:id       → findOne(id: string)
POST   /api/{feature}           → create(dto: CreateDto)
PATCH  /api/{feature}/:id       → update(id: string, dto: UpdateDto)   ← NUNCA PUT para actualizaciones parciales
DELETE /api/{feature}/:id       → remove(id: string)                   ← Soft-delete o anulación contable, NUNCA DELETE físico
```

### Next.js (Frontend)

| Elemento | Convención | Ejemplo |
|---|---|---|
| Feature page | `{feature}-page.tsx` | `products-page.tsx` |
| Hook | `use-{feature}.ts` | `use-products.ts` |
| Model | `{feature}.model.ts` | `product.model.ts` |
| Service | `{feature}.service.ts` | `products.service.ts` |
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
   export class InvoicesService {
     create(@Req() req: Request, dto: CreateInvoiceDto) { ... }
   }
   
   // ✅ BIEN: servicio puro, solo lógica de negocio
   @Injectable()
   export class InvoicesService {
     create(userId: string, dto: CreateInvoiceDto) { ... }
   }
   ```

3. **En el frontend, los `service.ts` son la única capa que llama a `fetch`/`axios`.**  
   Los hooks y componentes nunca hacen llamadas HTTP directamente.

4. **Validación de reglas de negocio vive en el backend (NestJS + class-validator).**  
   El frontend puede tener validación duplicada para UX inmediata, pero la fuente de verdad es el backend.

---

## 4. Módulos Core del Sistema

| Módulo | Descripción | Dependencias |
|---|---|---|
| `auth` | Login, registro, JWT, refresh tokens | Ninguna (módulo fundacional) |
| `users` | CRUD de usuarios, asignación de roles | `auth` |
| `companies` | Datos fiscales de la empresa (RIF, razón social) | `users` |
| `products` | Inventario de productos y servicios | `companies` |
| `customers` | Clientes (naturales y jurídicos) | `companies` |
| `invoices` | Facturación, notas de crédito/débito, retenciones | `companies`, `customers`, `products` |
| `pos` | Punto de venta (caja rápida) | `products`, `customers`, `invoices` |
| `accounting` | Libro diario, mayor, balance | `invoices` |
| `reports` | Reportes fiscales (IVA, ISLR, Libros IVSS) | `accounting`, `invoices` |
| `settings` | Configuración general, secuenciales, tasas | `companies` |

---

*Referencia cruzada: [database.md](database.md) — [security.md](security.md)*
