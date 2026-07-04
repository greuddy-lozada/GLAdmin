# Product Strategy — Estrategia de Producto

> Complemento BMAD: define el norte del producto, a quién sirve y qué construimos ahora vs. después.
> Última actualización: Julio 2026.

---

## Visión del Producto

Ser el punto de venta y sistema de gestión de inventario de referencia para PyMEs venezolanas: rápido, offline-first, multi-moneda y sin fricción.

---

## ICP — Perfil de Cliente Ideal

| Atributo | Valor |
|---|---|
| Tipo de negocio | PyMEs venezolanas (1-20 empleados) |
| Facturación mensual | 500 - 50,000 USD |
| Operación diaria | Ventas en mostrador, manejo de inventario, cobros en VES y USD |
| Madurez digital | Básico-medio. Usan WhatsApp, Excel, algunas usan un sistema viejo |
| Dolor principal | Gestionar ventas e inventario sin depender de internet ni de un sistema complejo |
| Quién decide | Dueño/gerente (no un CTO) |

### Anti-ICP — Quién NO es nuestro cliente

- Grandes empresas con ERP corporativo (SAP, Oracle)
- Negocios informales sin local físico ni inventario
- Startups tech que quieren API-first

---

## Propuesta de Valor

> **Para** dueños de PyMEs venezolanas **que** necesitan gestionar ventas, inventario y cobros sin depender de internet ni de sistemas complicados, **Cuadra** es un punto de venta y sistema de gestión **que** funciona offline, cobra con Pago Móvil y maneja VES y USD — todo en una plataforma que no requiere capacitación.

### Diferenciadores

1. **Offline POS**: la caja no se detiene si se cae internet. Sync automático cuando vuelve.
2. **Pago Móvil integrado**: el cliente paga y la venta se registra en un solo paso.
3. **Multi-moneda VES/USD**: precios, cobros y reportes en ambas monedas.
4. **Catálogo + inventario**: productos, categorías, marcas y control de stock en tiempo real.
5. **PWA sin app store**: no hay que instalar nada. Funciona en cualquier dispositivo.

---

## Competitive Moat

| Barrera | Cómo Cuadra la construye |
|---|---|
| Switching cost | Historial de ventas e inventario difíciles de migrar. Una vez que una empresa tiene meses de operación en Cuadra, migrar es doloroso. |
| Network effects | Dueños que recomiendan a otros dueños. El boca a boca entre PyMEs venezolanas es el canal más efectivo. |
| Localización profunda | Multi-moneda VES/USD, Pago Móvil integrado, tasa del día — no lo ofrece ningún SaaS genérico (QuickBooks, Zoho, Odoo). |
| Offline | POS funciona sin internet — crítico en Venezuela. Ningún competidor cloud ofrece esto sin fricción. |

---

## Estrategia de Producto (Strategic Bets)

1. **POS-first**: la caja es el producto. Velocidad, simplicidad y offline son la prioridad absoluta. Si el POS no es perfecto, nada más importa.
2. **Offline como ventaja**: donde los competidores fallan sin internet, Cuadra funciona. El offline no es un feature — es la razón para elegirnos.
3. **Dueño/gerente directo**: vendemos al que opera el negocio todos los días, no al contador. La experiencia debe ser inmediata y no requerir configuración.
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
| Analytics de ventas y Dashboard KPIs | Visibilidad del negocio: qué se vende, cuándo, margen, ticket promedio. |
| Historial de ventas y reporting | Búsqueda, filtros, exportación. El dueño necesita responder "¿cuánto vendí este mes?" |
| Soft Launch Alpha (5-10 empresas amigas) | Primera validación en producción real. |
| Refinamiento de UX en POS | Basado en feedback de Alpha: velocidad, atajos, flujo de cobro. |

### Later — Más allá del trimestre

| Iniciativa | Valor |
|---|---|
| Multi-caja / multi-sucursal | Sincronización entre varias cajas. Para retail con más de un punto de venta. |
| Facturación fiscal SENIAT | Solo si cambia la viabilidad. Mientras tanto, Cuadra es POS + gestión — no fiscal. |
| API pública para integraciones | Ecosistema de partners, conectores con e-commerce. |
| E-commerce bridge (integración con tiendas online) | Omnicanal para negocios que venden en línea y físico. |
