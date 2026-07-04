# Git Hygiene — Disciplina de Control de Versiones

> **Principio rector:** El historial de Git es documentación viva.  
> Cualquier desarrollador debe poder entender qué pasó, cuándo y por qué con solo leer `git log`.

---

## 1. Estrategia de Ramas

### Ramas principales

| Rama | Propósito | Protegida |
|---|---|---|
| `main` | Código en producción. Solo se mergea desde `develop` o `hotfix/*`. | ✅ Requiere PR + review + CI verde |
| `develop` | Integración continua. Features y fixes se mergean aquí. | ✅ Requiere PR + CI verde |

### Ramas temporales

| Prefijo | Propósito | Ejemplo | Se mergea a |
|---|---|---|---|
| `feat/` | Feature nueva | `feat/pos-shortcuts` | `develop` |
| `fix/` | Bug fix no-crítico | `fix/invoice-pdf-font` | `develop` |
| `hotfix/` | Fix crítico en producción | `hotfix/tax-calc-rounding` | `main` → luego `develop` |
| `chore/` | Tareas de mantenimiento | `chore/update-prisma-v6` | `develop` |
| `refactor/` | Refactor sin cambio funcional | `refactor/extract-tax-service` | `develop` |
| `docs/` | Cambios en documentación (.spec, README) | `docs/add-api-conventions` | `develop` |

### Reglas

1. **Nunca commits directos a `main` o `develop`.**
2. **Una rama = una preocupación.** No mezclar feature + refactor + fix en la misma rama.
3. **Ramas se eliminan después del merge.**
4. **Nombre de rama en inglés, lowercase, kebab-case**: `feat/add-tax-withholding`.

---

## 2. Conventional Commits

### Formato

```
<tipo>[ámbito opcional]: <descripción>

[cuerpo opcional]

[footer opcional]
```

### Tipos

| Tipo | Uso |
|---|---|
| `feat` | Nuevo feature (MINOR en SemVer) |
| `fix` | Bug fix (PATCH en SemVer) |
| `docs` | Solo cambios en documentación |
| `style` | Formato, linting, punto y coma (sin cambio funcional) |
| `refactor` | Refactor sin feature ni fix |
| `perf` | Mejora de performance |
| `test` | Agregar o corregir tests |
| `chore` | Tareas de build, CI, dependencias |
| `revert` | Revertir un commit anterior |

### Ámbitos (scopes) válidos

| Scope | Área |
|---|---|
| `auth` | Autenticación y autorización |
| `products` | Módulo de productos |
| `invoices` | Módulo de facturación |
| `pos` | Punto de venta |
| `customers` | Módulo de clientes |
| `accounting` | Módulo de contabilidad |
| `tax` | Retenciones e impuestos |
| `reports` | Reportes |
| `ui` | Componentes de UI compartidos |
| `i18n` | Traducciones |
| `db` | Migraciones y schema de BD |
| `config` | Configuración, env, CI/CD |
| `deps` | Dependencias |

### Ejemplos

```
feat(pos): agregar atajo Ctrl+B para buscar producto
fix(invoices): corregir redondeo de IVA en facturas con múltiples ítems
refactor(tax): extraer cálculo de retención a TaxCalculator service
test(invoices): agregar tests de inmutabilidad contable
chore(deps): actualizar Prisma a v6.0.0
docs(spec): agregar api-conventions.md al índice de specs
```

### Reglas

1. **Título en inglés, lowercase, máximo 72 caracteres.**
2. **No punto final en el título.**
3. **Usar modo imperativo:** `add` no `added`, `fix` no `fixed`.
4. **Si el cambio cierra un issue, referenciarlo en el footer:** `Closes #42`.

---

## 3. Pull Requests

### Tamaño máximo

| Métrica | Límite |
|---|---|
| Líneas cambiadas (diff) | ≤ 400 líneas |
| Archivos modificados | ≤ 10 archivos |
| Commits | Sin límite (se hace squash merge) |

Si un PR excede estos límites → dividir en PRs más pequeños.

### Estructura del PR

```markdown
## Descripción
Breve resumen de qué hace este cambio y por qué.

## Tipo de cambio
- [ ] feat (nueva funcionalidad)
- [ ] fix (corrección de bug)
- [ ] refactor
- [ ] docs
- [ ] chore

## ¿Requiere migración de BD?
- [ ] No
- [ ] Sí — describir: _____

## ¿Rompe algo existente? (Breaking change)
- [ ] No
- [ ] Sí — describir: _____

## Checklist
- [ ] Test agregados/actualizados
- [ ] Lint pasa (0 warnings)
- [ ] Typecheck pasa (0 errores)
- [ ] Build exitoso
- [ ] i18n: llaves nuevas en es.json y en.json
- [ ] Si toca facturación/contabilidad: tests de inmutabilidad incluidos

## Screenshots / Evidencia
(Si aplica — cambios visuales, respuestas de API)

## Issues relacionados
Closes #XXX
```

### Reglas de review

1. **Mínimo 1 aprobación** para mergear a `develop`.
2. **Mínimo 2 aprobaciones** para mergear a `main` (release).
3. **El autor NO aprueba su propio PR.**
4. **La review verifica:** lógica, seguridad (RBAC, inmutabilidad), performance (N+1, bundle), tests.
5. **Squash merge a `develop` y `main`.** Historial lineal, un commit por PR.

---

## 4. Estrategia de Merge

```
feat/xyz ──→ develop ──→ main
                ↑            ↑
fix/abc ────────┘            │
hotfix/urgent ───────────────┘
```

### Flujo estándar

```bash
# 1. Crear rama desde develop
git checkout develop && git pull
git checkout -b feat/pos-shortcuts

# 2. Trabajar, commitear con conventional commits
git commit -m "feat(pos): agregar atajo Ctrl+B para buscar producto"

# 3. Push y abrir PR a develop
git push -u origin feat/pos-shortcuts

# 4. Después de review + CI verde → squash merge a develop (desde GitHub UI)

# 5. Eliminar rama
git branch -d feat/pos-shortcuts
```

### Release a producción

```bash
# 1. develop está listo para release
git checkout develop && git pull

# 2. Crear PR de develop → main

# 3. Después de review → squash merge (o merge commit si se quiere preservar historial de release)

# 4. Taggear la versión
git checkout main && git pull
npm version minor  # o patch, o major
git push --follow-tags

# 5. CI/CD despliega automáticamente a producción
```

---

## 5. Reglas de .gitignore

Archivos que **nunca** se commitean:

```gitignore
# Dependencias
node_modules/

# Build output
dist/
.next/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Database
*.db
*.db-journal

# Uploads (local dev)
uploads/
!uploads/.gitkeep

# Coverage
coverage/
.nyc_output/

# Logs
*.log
logs/

# Misc
.turbo/
*.tsbuildinfo
```

---

## 6. Git Hooks (Husky + lint-staged)

```json
// package.json (raíz)
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix --max-warnings 0",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
pnpm lint-staged

# .husky/commit-msg
pnpm commitlint --edit $1
```

### commitlint config

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert'
    ]],
    'scope-enum': [2, 'always', [
      'auth', 'products', 'invoices', 'pos', 'customers', 'accounting',
      'tax', 'reports', 'ui', 'i18n', 'db', 'config', 'deps'
    ]],
    'subject-max-length': [2, 'always', 72],
  },
};
```

---

*Referencia cruzada: [release-policy.md](release-policy.md) — [deployment.md](deployment.md)*
