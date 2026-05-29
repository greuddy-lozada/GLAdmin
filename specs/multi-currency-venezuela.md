# Multi-Currency & Venezuela Compliance

## Core domain rules

GLAdmin operates with **dual-currency bookkeeping** (VED + USD) for all financial transactions, plus Venezuela-specific tax and legal requirements.

---

## 1. Currency Architecture

### Supported currencies

| Code | Name | Type |
|---|---|---|
| VED | Bolívar (digital) | Local fiat |
| USD | US Dollar | Reference / secondary |

All future currencies (EUR, COP, etc.) follow the same exchange-rate pattern.

### Exchange rates

Rates are stored in the `ExchangeRate` table:

```prisma
model ExchangeRate {
  id              Int      @id @default(autoincrement())
  fromCurrencyId  Int      // always VED
  toCurrencyId    Int      // always USD
  calculationRate Decimal  @db.Decimal(10, 4)  // market/parallel rate
  officialRate    Decimal  @db.Decimal(10, 4)  // BCV official rate
  recordedAt      DateTime @default(now())
  fromCurrency    Currency @relation("FromCurrency", fields: [fromCurrencyId], references: [id])
  toCurrency      Currency @relation("ToCurrency", fields: [toCurrencyId], references: [id])
}
```

- `calculationRate` — used for all internal financial calculations (pricing, inventory valuation, P&L)
- `officialRate` — used for tax declarations, legal reporting, withholding calculations
- Both rates are recorded together in a single row — no separate BCV table
- Rates are immutable after creation (audit trail)

### Rate sourcing

| Source | Used for | Update frequency |
|---|---|---|
| Manual entry | All rates | As-needed (admin) |
| BCV web scrape (future) | `officialRate` | Daily (automated) |
| Parallel market API (future) | `calculationRate` | Daily (automated) |

---

## 2. Dual-Currency Fields

Every financial model carries amounts in both VED and USD:

```prisma
model PurchaseOrder {
  // ...
  subtotalVed  Decimal @db.Decimal(14, 2)
  subtotalUsd  Decimal @db.Decimal(14, 2)
  taxVed       Decimal @db.Decimal(14, 2)
  taxUsd       Decimal @db.Decimal(14, 2)
  totalVed     Decimal @db.Decimal(14, 2)
  totalUsd     Decimal @db.Decimal(14, 2)
}

model PurchaseOrderDet {
  // ...
  unitPriceVed Decimal @db.Decimal(14, 2)
  unitPriceUsd Decimal @db.Decimal(14, 2)
  subtotalVed  Decimal @db.Decimal(14, 2)
  subtotalUsd  Decimal @db.Decimal(14, 2)
}
```

### Conversion rules

1. User enters amount in **either currency** (form field includes currency selector)
2. Backend converts to the other using the **latest `calculationRate`** at time of entry
3. Both values are stored; rate snapshot is **not** stored per-line (rate can be reconstructed from `recordedAt`)
4. VED is the **base currency** — all reports and totals default to VED
5. USD amounts are always recalculable against VED via historical rates

### When to show which currency

| Context | Display |
|---|---|
| Invoices, receipts | VED (legal requirement) |
| Supplier prices | Both (supplier contract specifies) |
| Inventory valuation | VED (cost basis) |
| Purchase orders | Both (user preference toggle) |
| Dashboards / charts | VED (default), USD toggle |
| Tax declarations | VED (SENIAT requirement) |

---

## 3. Venezuela Tax Compliance

### IVA (Value Added Tax)

| Rate | Code | Description |
|---|---|---|
| 16% | IVA-G | General rate (most goods/services) |
| 8% | IVA-R | Reduced rate (basic food, medicine) |
| 0% | IVA-E | Exempt (education, health, exports) |

Implemented via existing `Tax` model:

```prisma
model Tax {
  id          Int      @id @default(autoincrement())
  name        String   // "IVA General", "IVA Reducido", "IVA Exento"
  slug        String   @unique  // "iva-general", "iva-reducido", "iva-exento"
  rate        Decimal  @db.Decimal(5, 2)  // 16.00, 8.00, 0.00
  type        TaxType  // SALES, PURCHASE, WITHHOLDING
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Tax calculation on purchase orders:

```
tax_amount = subtotal × (rate / 100)
```

### ISLR (Income Tax Withholding)

| Threshold | Rate | Applies to |
|---|---|---|
| > 1,000 UT | 3% | Services from legal entities |
| > 500 UT | 5% | Services from individuals |
| > 2,000 UT | 2% | Goods purchases |

UT (Unidad Tributaria) is a yearly value set by SENIAT. Store as a system config:

```prisma
model SystemConfig {
  id    Int    @id @default(autoincrement())
  key   String @unique  // "UT_VALUE"
  value String  // "900.00" (VED)
}
```

### Withholding record

```prisma
model WithholdingRecord {
  id                Int      @id @default(autoincrement())
  invoiceNumber     String
  supplierId        Int
  companyId         Int
  taxType           TaxType  // IVA, ISLR
  baseAmountVed     Decimal  @db.Decimal(14, 2)
  baseAmountUsd     Decimal  @db.Decimal(14, 2)
  rate              Decimal  @db.Decimal(5, 2)
  amountVed         Decimal  @db.Decimal(14, 2)
  amountUsd         Decimal  @db.Decimal(14, 2)
  exchangeRate      Decimal  @db.Decimal(10, 4)  // rate used at calculation time
  fiscalPeriod      String   // "2026-01"
  createdAt         DateTime @default(now())
  supplier          Supplier @relation(fields: [supplierId], references: [id])
  company           Company  @relation(fields: [companyId], references: [id])
}
```

---

## 4. RIF & Tax ID

> **Note:** Venezuela uses **RIF** (Registro de Información Fiscal). **RNC** is the Dominican Republic's tax ID — not applicable here.

### Supplier/Company registration

All Venezuelan suppliers and companies require:

| Field | Format | Example | Required |
|---|---|---|---|
| RIF | `J-XXXXXXXX-X` | `J-12345678-9` | Yes |
| Business Name | Free text | "Comercial XYZ, C.A." | Yes |
| IVA responsible | Boolean | true/false | Yes |
| Withholding agent | Boolean | true/false | Yes |

### RIF validation (backend)

```ts
function isValidRIF(rif: string): boolean {
  return /^[JPGVEjpgve]-\d{8,9}-\d$/.test(rif);
}
```

RIF format by entity type:
- `J` — Legal entity (most suppliers)
- `G` — Government
- `V` — Venezuelan individual
- `E` — Foreign individual
- `P` — Passport

---

## 5. Fiscal Periods

All transactions are tagged with a fiscal period `YYYY-MM` for:

- Monthly IVA declarations (Form ITF)
- Monthly ISLR withholding declarations
- Annual declaring (Form 17)
- Fiscal year closing

The fiscal period is derived automatically from `createdAt` date of the transaction. No separate Period table is needed — filtered via:

```sql
WHERE strftime('%Y-%m', createdAt) = '2026-01'
```

Or in Prisma:

```ts
const start = new Date('2026-01-01');
const end = new Date('2026-02-01');
prisma.purchaseOrder.findMany({
  where: { createdAt: { gte: start, lt: end } },
});
```

---

## 6. Reports required by law

| Report | Content | Frequency |
|---|---|---|
| IVA Purchase Ledger | All purchases with IVA, grouped by supplier | Monthly |
| IVA Sales Ledger | All sales with IVA | Monthly |
| ISLR Withholding Certificate | Per-supplier withholding summary | Annually |
| Balance Sheet (VED) | Assets, liabilities, equity in VED | Annually |
| P&L (VED) | Income/expense in VED | Monthly |

These are **future work** — not implemented yet. They will query the existing dual-currency fields and WithholdingRecord table.

---

## 7. Implementation order

| Step | What | Depends on |
|---|---|---|
| 1 | ExchangeRate module (table, CRUD, latest-rate endpoint) | Currencies seed |
| 2 | Rate selector component in forms (auto-convert entered amount) | Step 1 |
| 3 | Dual-currency columns on PurchaseOrder, PurchaseOrderDet | Step 2 |
| 4 | IVA calculation on purchase order line items | Steps 2-3 |
| 5 | RIF validation + supplier fields | — |
| 6 | WithholdingRecord module + ISLR calculation | Steps 3, 5 |
| 7 | Fiscal period filtering on list views | Step 6 |
| 8 | IVA Purchase Ledger report | Step 4 |
| 9 | ISLR Withholding Certificate report | Step 6 |
| 10 | BCV auto-scraper (optional) | Step 1 |

**Current status:** Steps 1-2 implemented (ExchangeRate CRUD + endpoint exist, no rate selector component yet).
