# Product Strategy — Estrategia de Producto

> Complemento BMAD: define el norte del producto, a quién sirve y qué construimos ahora vs. después.
> Última actualización: Julio 2026.

---

## Visión del Producto

Ser el sistema de gestión administrativa de referencia para PyMEs venezolanas, combinando facturación fiscal SENIAT, punto de venta offline-first y contabilidad en una sola plataforma accesible.

---

## ICP — Perfil de Cliente Ideal

| Atributo | Valor |
|---|---|
| Tipo de negocio | PyMEs venezolanas (1-20 empleados) |
| Facturación mensual | 500 - 50,000 USD |
| Necesidad fiscal | Emiten facturas SENIAT, IVA, ISLR, retenciones |
| Madurez digital | Básico-medio. Usan WhatsApp, Excel, algunas usan un sistema viejo |
| Dolor principal | Cumplimiento fiscal sin un contador dedicado |
| Quién decide | Dueño/gerente (no un CTO) |

### Anti-ICP — Quién NO es nuestro cliente

- Grandes empresas con ERP corporativo (SAP, Oracle)
- Negocios informales que no emiten facturas
- Startups tech que quieren API-first
- Empresas fuera de Venezuela (sin necesidad de formato SENIAT)

---

## Propuesta de Valor

> **Para** dueños de PyMEs venezolanas **que** necesitan cumplir con el SENIAT y gestionar su negocio sin un contador interno, **Cuadra** es un sistema de gestión administrativa **que** emite facturas fiscales, cobra con Pago Móvil y funciona sin internet — todo en una plataforma que no requiere capacitación.

### Diferenciadores

1. **Offline POS**: la caja no se detiene si se cae internet. Sync automático cuando vuelve.
2. **Pago Móvil integrado**: el cliente paga y la factura se registra en un solo paso.
3. **Multi-moneda VES/USD**: precios, cobros y reportes en ambas monedas.
4. **Formato fiscal venezolano**: facturas, notas de crédito/débito, retenciones IVA/ISLR — compatible con el SENIAT.
5. **PWA sin app store**: no hay que instalar nada. Funciona en cualquier dispositivo.

---

## Competitive Moat

| Barrera | Cómo Cuadra la construye |
|---|---|
| Switching cost | Datos fiscales históricos difíciles de migrar. Una vez que una empresa tiene 6 meses de facturas en Cuadra, migrar es doloroso. |
| Network effects | Contadores que atienden múltiples empresas en Cuadra — recomiendan la plataforma y se vuelven dependientes del ecosistema. |
| Localización profunda | Formato fiscal venezolano, multi-moneda, Pago Móvil — no lo ofrece ningún SaaS genérico (QuickBooks, Zoho, Odoo). |
| Offline | POS funciona sin internet — crítico en Venezuela. Ningún competidor cloud ofrece esto. |

---

## Estrategia de Producto (Strategic Bets)

1. **Fiscal-first**: facturación SENIAT impecable antes que analytics avanzados. Si las facturas no son válidas, el producto no sirve.
2. **Offline como ventaja**: donde los competidores fallan sin internet, Cuadra funciona. El offline no es un feature — es la razón para elegirnos.
3. **Contador como distribuidor**: el contador recomienda Cuadra a sus clientes PyMEs. Si el contador confía en nuestros reportes, trae 10-20 empresas.
4. **Mobile-no-app**: PWA en vez de app nativa. Mismo código, distribución más barata, sin comisiones de app stores.

---

## Roadmap

### Now — En progreso

| Iniciativa | Valor | Estado |
|---|---|---|
| POS Redesign ("Compra con Detalles") | Velocidad de caja, UX mejorada | ✅ Complete |
| Subscription Payments (Pago Móvil + Cash USD) | Monetización funcional en Venezuela | ✅ Complete |
| Categorías y Marcas | Catálogo organizado para negocios con inventario variado | 🔄 En progreso |
| Plan Gating | Features por plan, control de acceso | ✅ Complete |

### Next — Próximo trimestre

| Iniciativa | Valor |
|---|---|
| Módulo de Contabilidad (libro diario, mayor, balance) | Diferencial fiscal fuerte. Sin esto, el contador no migra. |
| Reportes Fiscales (IVA, ISLR, Libros IVSS) | Requisito legal obligatorio para empresas formales. |
| Retención de IVA/ISLR | Cerrar el ciclo fiscal completo. |
| Soft Launch Alpha (5-10 empresas amigas) | Primera validación en producción real. |

### Later — Más allá del trimestre

| Iniciativa | Valor |
|---|---|
| Multi-dispositivo sync (varias cajas en sucursal) | Retail más grande con múltiples puntos de venta. |
| API pública para integraciones | Ecosistema de partners, conectores con e-commerce. |
| E-commerce bridge (integración con tiendas online) | Omnicanal para negocios que venden en línea y físico. |
| Módulo de Nómina | Stickyness — una vez que la nómina está en Cuadra, el churn es casi imposible. |
