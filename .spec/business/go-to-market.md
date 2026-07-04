# Go-to-Market — Estrategia de Lanzamiento

> Complemento BMAD: plan para pasar de "producto en desarrollo" a "producto generando ingresos recurrentes".
> Última actualización: Julio 2026.

---

## Fases de Lanzamiento

### Fase 0: Alpha Cerrada

| Atributo | Valor |
|---|---|
| Usuarios | 3-5 empresas (amigos, familiares, contactos cercanos) |
| Precio | Gratis a cambio de feedback activo |
| Compromiso nuestro | Soporte directo por WhatsApp. Llamada semanal de feedback. |
| Objetivo | Encontrar bugs críticos. Validar que los flujos core (vender, cobrar, gestionar inventario desde el POS) funcionan en el mundo real. |
| Duración | 4-8 semanas |
| Criterio de salida | 0 bugs críticos abiertos. Flujo completo de venta (buscar producto → agregar → cobrar) probado por al menos 3 empresas distintas. Feedback cualitativo positivo ("lo usaría en mi negocio"). |

### Fase 1: Beta Abierta

| Atributo | Valor |
|---|---|
| Usuarios | 20-50 empresas |
| Precio | 50% de descuento sobre precio final planeado |
| Adquisición | Referidos de Alpha. Grupos de WhatsApp/Telegram de emprendedores. Posts en redes sociales. |
| Objetivo | Validar pricing, retención, y capacidad de soporte a escala. Encontrar bugs de edge cases. |
| Duración | 8-12 semanas |
| Criterio de salida | Retención > 60% a 30 días. NPS > 30. Tiempo medio de respuesta en soporte < 4 horas. Al menos 10 empresas pagan (aunque sea con descuento). |

### Fase 2: GA — Disponibilidad General

| Atributo | Valor |
|---|---|
| Usuarios | Sin límite |
| Precio | Precio completo según plan elegido |
| Adquisición | Dueños/gerentes directos. Google Ads (presupuesto bajo, alta segmentación). SEO. Referidos con incentivo. |
| Objetivo | Crecimiento sostenible mes a mes. |
| Duración | Continua |
| Criterio de éxito | 50+ empresas con suscripción activa. MRR estable o creciente. Churn mensual < 5%. |

---

## Pricing & Plans

> Definición detallada en `specs/2026-06-20-plan-gating.md`. Resumen de referencia:

| Plan | Precio (USD/mes) | Usuarios | Features clave |
|---|---|---|---|
| **Free** | $0 | 1 | POS básico, hasta 50 productos, ventas ilimitadas |
| **Pro** | Por definir | 5 | Catálogo ilimitado, Pago Móvil, multi-moneda, analytics básicos |
| **Business** | Por definir | 20 | + Analytics avanzados, dashboard KPIs, multi-caja, exportación de datos |
| **Enterprise** | Custom | Ilimitado | + API, multi-sucursal, soporte prioritario, SLAs |

---

## Canales de Adquisición

| Canal | Prioridad | Inversión | Notas |
|---|---|---|---|
| Referidos boca a boca | **Alta** | $0 | El más efectivo en PyMEs venezolanas. Incentivar con mes gratis por referido. |
| Grupos de WhatsApp/Telegram | **Alta** | $0 | Comunidades activas de emprendedores venezolanos. Compartir valor, no spam. |
| Instagram / TikTok | **Media** | Contenido orgánico | Tutoriales cortos: "cómo vender más rápido con Cuadra", tips de gestión de inventario. |
| Contadores (canal secundario) | **Media** | Comisión o fee fijo | Si un contador recomienda Cuadra, gana comisión. No es el canal principal pero suma. |
| Google Ads | **Baja** | Presupuesto controlado | Keywords: "punto de venta", "sistema POS Venezuela", "software de inventario". |
| SEO / Blog | **Baja** | Tiempo | Contenido evergreen sobre gestión de PyMEs. Atrae tráfico pasivo a largo plazo. |

---

## Métricas de Éxito

| Métrica | Alpha | Beta (fin) | GA (mes 3) | GA (mes 6) |
|---|---|---|---|---|
| Empresas activas | 5 | 50 | 100 | 200+ |
| MRR | $0 | $X | $Y | $Z |
| Churn mensual | N/A | < 15% | < 5% | < 5% |
| NPS | N/A | > 30 | > 40 | > 40 |
| Time-to-value (1ra venta registrada) | < 2 días | < 1 día | < 1 hora | < 30 min |
| Tickets de soporte por empresa/mes | Ilimitado | < 3 | < 1 | < 0.5 |
| Tasa de conversión Free → Pro | N/A | N/A | > 5% | > 8% |

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Competidor local (Loyverse, Zulu, Alegra) captura el mercado | Media | Alto | Moat: offline POS + multi-moneda VES/USD + Pago Móvil integrado. Competidores cloud no funcionan sin internet. |
| Competidor local bien fondeado entra al mercado | Baja | Alto | Moat: historial de ventas + offline POS. Switching cost alto una vez adoptado. |
| Inestabilidad de internet en Venezuela | Muy alta | Medio | POS offline-first. PWA con service worker. Sync automático al reconectar. |
| Usuarios no renuevan (cash culture, prefieren pago único) | Media | Alto | Período de gracia corto. Recordatorios automáticos. Descuento por pago anual. Suspensión de servicio (datos no se pierden). |
| Tipo de cambio VES/USD volátil | Muy alta | Bajo | Precios fijados en USD. Pago Móvil calculado a tasa del día. |
| Fraude en Pago Móvil (comprobantes falsos) | Media | Medio | Revisión manual de comprobantes en Alpha/Beta. Automatizar verificación en GA. |

---

## Referencias

- [Plan Gating](../../specs/2026-06-20-plan-gating.md) — Definición de features por plan
- [Subscription Payments](../../specs/2026-06-17-subscription-payments.md) — Implementación de Pago Móvil + Cash USD
