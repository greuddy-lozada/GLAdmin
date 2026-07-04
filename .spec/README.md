# .spec — Fuente de Verdad de Cuadra

> **Directorio canónico de especificaciones.**  
> Todo agente de IA, desarrollador humano o herramienta de CI/CD debe consultar este índice antes de escribir, revisar o desplegar código.  
> Si una regla no está documentada aquí, **no existe**.

---

## Mapa de Documentos

### 🧠 Comportamiento del Agente
| Archivo | Propósito |
|---|---|
| [[AGENTS.md]] | Instrucciones generales de tono, estilo de código y convenciones para agentes de IA. |

### 🏗️ Sistema (Reglas de Arquitectura)
| Archivo | Propósito |
|---|---|
| [system/architecture.md](system/architecture.md) | Vertical Slicing, convenciones NestJS/Next.js, desacoplamiento. |
| [system/security.md](system/security.md) | AuthN (JWT), RBAC, Inmutabilidad Contable, API Security. |
| [system/database.md](system/database.md) | PostgreSQL, migraciones, seeds, naming. |
| [system/api-conventions.md](system/api-conventions.md) | Formato de respuesta, códigos HTTP, paginación, error codes. |
| [system/testing.md](system/testing.md) | Cobertura, estructura de tests, factory functions, E2E. |
| [system/performance.md](system/performance.md) | Bundle size, query limits, P95 latency, caching. |

### 💼 Negocio — BMAD Method
| Archivo | Propósito |
|---|---|
| [business/product-strategy.md](business/product-strategy.md) | Visión, ICP, propuesta de valor, competitive moat, roadmap. |
| [business/customer-discovery.md](business/customer-discovery.md) | Hipótesis, guía de entrevista, learning cards, experimentos. |
| [business/go-to-market.md](business/go-to-market.md) | Fases de lanzamiento, pricing, canales, métricas, riesgos. |

### 🎨 UI/UX
| Archivo | Propósito |
|---|---|
| [UI-UX/design-system.md](UI-UX/design-system.md) | Tokens de Tailwind, estados de UI, skeletons, empty states, a11y. |

### 🚀 DevOps & Entrega
| Archivo | Propósito |
|---|---|
| [DevOps/deployment.md](DevOps/deployment.md) | Entorno local, Docker, variables de entorno, CI/CD, dependencias, monitoring. |
| [DevOps/release-policy.md](DevOps/release-policy.md) | Criterios de producción, smoke tests, rollback. |
| [DevOps/git-hygiene.md](DevOps/git-hygiene.md) | Ramas, conventional commits, PRs, git hooks. |

---

## Stack Tecnológico (Resumen)

| Capa | Tecnología |
|---|---|
| Monorepo | pnpm workspaces |
| Backend | NestJS + Prisma ORM + class-validator |
| Frontend | Next.js 15 (App Router) + React 19 + Tailwind CSS v4 + shadcn/ui v4 |
| Base de datos | PostgreSQL |
| Autenticación | JWT + RBAC |
| Animaciones | motion (framer-motion) |
| Iconos | lucide-react |
| Tema | next-themes (class strategy) |
| i18n | JSON locales (es.json, en.json) |

---

## Cómo usar este directorio

0. **Antes de decidir qué construir**, consulta [business/product-strategy.md](business/product-strategy.md) (visión, roadmap) y valida con [business/customer-discovery.md](business/customer-discovery.md) (hipótesis, entrevistas).
1. **Antes de implementar un feature nuevo**, lee [system/architecture.md](system/architecture.md) y [system/api-conventions.md](system/api-conventions.md).
2. **Antes de tocar la base de datos**, consulta [system/database.md](system/database.md) y [system/security.md](system/security.md) (regla de inmutabilidad contable).
3. **Antes de crear UI**, revisa [UI-UX/design-system.md](UI-UX/design-system.md) (incluye accesibilidad).
4. **Antes de commitear**, revisa [DevOps/git-hygiene.md](DevOps/git-hygiene.md) (conventional commits, tamaño de PR).
5. **Antes de hacer deploy**, ejecuta el checklist de [DevOps/release-policy.md](DevOps/release-policy.md).
6. **Antes de escribir tests**, consulta [system/testing.md](system/testing.md) (umbrales y estructura).
7. **Si algo está lento**, revisa [system/performance.md](system/performance.md) (límites y baselines).

---

## Mantenimiento

- Todo cambio en reglas de arquitectura, seguridad o procesos debe reflejarse aquí **en el mismo pull request** que introduce el cambio de código.
- Las specs se escriben en **Markdown estándar** — sin formatos propietarios.
- El índice (`README.md`) debe mantenerse actualizado cuando se añadan nuevos documentos al directorio `.spec/`.

---

*Última actualización: Julio 2026*
