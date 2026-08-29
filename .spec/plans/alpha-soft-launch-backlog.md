# Soft Launch Alpha — Backlog 2 semanas

> **status:** `active`  
> **For agentic workers:** implementar task-by-task; checkboxes `- [ ]` para tracking.  
> **Goal:** Dejar Cuadra listo para 5–10 empresas amigas (Alpha) y un ciclo de feedback medible.  
> **Architecture:** Priorizar estabilización del flujo core (POS → sync → stock → cobro) sobre features nuevas; solo un cambio de dominio (emitir/anular venta) si desbloquea reportes limpios.  
> **Tech Stack:** NestJS + Prisma · Next.js PWA · Dexie sync · specs en `.spec/features/`  
> **Referencias:** [go-to-market.md](../business/go-to-market.md) Fase 0 · [product-strategy.md](../business/product-strategy.md) Next · [sales.md](../features/sales.md) · [reports.md](../features/reports.md)

**Criterio de salida Alpha (producto):**

- [ ] ≥3 empresas distintas completaron buscar → carrito → cobrar (online u offline→sync)
- [ ] 0 bugs críticos abiertos (caja rota, stock corrupto, cobro perdido, login/org inaccesible)
- [ ] Feedback cualitativo documentado (“lo usaría” / “no usaría porque…”)

**Fuera de scope (2 semanas):** SENIAT, multi-sucursal, API pública, e-commerce, marca page dedicada.

---

## Semana 1 — Estabilizar + instrumentar

### Días 1–2: Checklist operativo Alpha

- [ ] Documentar en 1 página (puede vivir abajo § Runbook) cómo dar de alta una empresa Alpha: org, plan, usuario executive, tasa del día, 5–10 productos seed, caja.
- [ ] Verificar staging/prod: migraciones al día (incl. `fix_admin_role_level`), `REDIS_URL` opcional, `JWT_SECRET`, Pago Móvil env si cobran suscripción.
- [ ] Smoke manual (humano): login → select org → POS venta cash → sync indicator OK → stock bajó → reporte sales_summary del día.
- [ ] Smoke offline: DevTools offline → venta → online → push → misma venta en servidor.
- [ ] Crear hoja de feedback (Notion/Sheet): fecha, empresa, flujo, severidad, cita textual.

### Días 2–3: Hardening flujos críticos (bugs > features)

Prioridad al reproducir / fixear lo que Alpha romperá primero:

| # | Riesgo | Dónde mirar | Done when |
|---|---|---|---|
| H1 | Sync oversold / conflictos | `.spec/features/sync.md`, `sync-engine`, `SyncConflict` UI | Venta offline conflictiva no deja stock negativo silencioso |
| H2 | Sesión offline / tokens | `auth-provider`, refresh | Caja sigue usable offline con sesión cacheada; 401 limpia bien |
| H3 | Cobro crédito + CXC | POS payment credit, `accounts-receivable` | Venta crédito crea AR; abono reduce saldo |
| H4 | Master en org | `RolesGuard` master bypass (ya shipped) | Master opera POS/users sin 403 |
| H5 | Mobile POS | `patterns.md` sticky cart, product rows | Flujo cobro usable en teléfono |

- [ ] Triage: abrir GitHub Issues para cada bug crítico encontrado en smoke (label `alpha-blocker`).
- [ ] Fix solo `alpha-blocker`s; el resto → backlog post-Alpha.

### Días 4–5: Ventas — emitir (mínimo viable)

Desbloquea reportes fiscales más limpios y cierra el gap de [sales.md](../features/sales.md).

**Archivos probables:**

- `backend/src/modules/sales/sales.service.ts` (+ controller/DTO)
- `frontend/src/features/pos/` (post-cobro: marcar emitida o emitir al cobrar)
- `.spec/features/sales.md`, `pos.md`

- [ ] Definir regla MVP (elegir una y documentarla en sales.md):
  - **A (recomendado):** al completar cobro en POS/sync, venta pasa `DRAFT` → `ISSUED` (inmutable).
  - **B:** botón “Emitir” explícito post-venta (más fricción).
- [ ] Implementar transición a `ISSUED` + rechazo de update financiero (`SALE_001` ya existe).
- [ ] Anulación mínima: endpoint/status `ANNULLED` + motivo + restore stock (sin notas de crédito).
- [ ] Ajustar `fiscal_iva` (y notas en reports.md): excluir `DRAFT` cuando el flujo ISSUED esté activo.
- [ ] Test: unit/service create→issued; attempt patch issued → SALE_001; annul restores stock.
- [ ] E2E smoke o script manual documentado: vender → ver ISSUED → anular → stock vuelve.

---

## Semana 2 — Reportes ops + Alpha live

### Días 6–8: Reports P1 (solo lo que el dueño pide al cierre)

Orden sugerido (máximo valor / esfuerzo):

1. `sales_by_payment_method`
2. `cash_register_summary` (si caja/sesión ya existe en código; si no, diferir)
3. `purchases_received`
4. `sales_fx_breakdown`

Por cada tipo:

- [ ] Entry en `backend/src/modules/reports/report-registry.ts`
- [ ] i18n `es.json` + `en.json` (`reports.*`)
- [ ] Renderer/labels en `frontend/src/features/reports/`
- [ ] Mover fila backlog → Shipped en [reports.md](../features/reports.md)

Mejoras baratas sobre shipped (si sobra tiempo):

- [ ] Default rango = mes calendario en params
- [ ] Header print: nombre + RIF org
- [ ] Totales VES + USD donde aplique

### Días 9–10: Onboarding Alpha + feedback

- [ ] Invitar 3–5 empresas (Fase 0 GTM); plan free o profesional trial; WhatsApp de soporte.
- [ ] Llamada/kickoff 15 min: “hoy solo vender, cobrar, ver inventario y un reporte”.
- [ ] Checklist de observación (no preguntar features; observar):
  - Tiempo hasta primera venta
  - ¿Usó mouse o teclado?
  - ¿Offline?
  - ¿Pidió factura fiscal? (anotar, no construir)
- [ ] Fin de semana 2: actualizar este plan — qué se shippeó, qué blockers quedan, top 5 pedidos Alpha.

---

## Runbook — Alta empresa Alpha (plantilla)

1. Master: Admin → Organizations → crear org + plan.
2. Asignar usuario executive (o invitar).
3. Login como executive → tasa de cambio del día.
4. Categoría + 5 productos con stock.
5. (Opcional) Abrir sesión de caja.
6. Probar 1 venta cash + 1 crédito (si aplica).
7. Generar `sales_summary` del día y compartir captura.
8. Anotar en hoja de feedback: fecha, contacto WhatsApp, plan.

---

## Tracking Issues (crear al empezar)

| Issue title (sugerido) | Label |
|---|---|
| alpha: smoke checklist staging | `alpha` |
| feat(sales): DRAFT→ISSUED on paid POS sale | `alpha`, `domain` |
| feat(sales): annul sale + restore stock | `alpha`, `domain` |
| feat(reports): sales_by_payment_method | `alpha` |
| feat(reports): cash_register_summary | `alpha` |
| chore: alpha feedback sheet + weekly call | `alpha`, `gtm` |

---

## Definición de Done (esta ventana)

- [ ] Runbook usable por ti sin ayuda del agente
- [ ] ISSUED (+ annul MVP) en código + sales.md actualizado **o** decisión explícita “defer” documentada con motivo
- [ ] ≥1 reporte P1 shipped **o** defer documentado tras feedback día 1–2
- [ ] ≥3 empresas en Alpha con al menos 1 venta real
- [ ] Lista de bugs críticos vacía o con owner + ETA

---

## Después de estas 2 semanas (no empezar ahora)

- Feature specs: cash-register, pago-movil, customers, stocks
- Resto Reports P1
- Tests E2E POS/sync ampliados
- UX POS refinements **solo** desde feedback Alpha
- SENIAT / multi-sucursal → Later
