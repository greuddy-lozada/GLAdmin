/** Maps report type slugs to i18n keys. Prefer this over trusting API `name` strings. */

const TYPE_LABEL_KEYS: Record<string, string> = {
  sales_summary: 'reports.types.salesSummary',
  sales_by_customer: 'reports.types.salesByCustomer',
  sales_by_product: 'reports.types.salesByProduct',
  inventory_status: 'reports.types.inventoryStatus',
  stock_movements: 'reports.types.stockMovements',
  fiscal_iva: 'reports.types.fiscalIva',
  fiscal_withholding: 'reports.types.fiscalWithholding',
  financial_ar: 'reports.types.financialAr',
  financial_ap: 'reports.types.financialAp',
};

const TYPE_DESC_KEYS: Record<string, string> = {
  sales_summary: 'reports.types.salesSummaryDesc',
  sales_by_customer: 'reports.types.salesByCustomerDesc',
  sales_by_product: 'reports.types.salesByProductDesc',
  inventory_status: 'reports.types.inventoryStatusDesc',
  stock_movements: 'reports.types.stockMovementsDesc',
  fiscal_iva: 'reports.types.fiscalIvaDesc',
  fiscal_withholding: 'reports.types.fiscalWithholdingDesc',
  financial_ar: 'reports.types.financialArDesc',
  financial_ap: 'reports.types.financialApDesc',
};

type Translate = (key: string) => string;

/** Resolve a label: i18n key → translate; otherwise return as-is. */
export function resolveReportLabel(value: string, t: Translate): string {
  if (value.startsWith('reports.')) return t(value);
  return value;
}

export function getReportTypeLabel(type: string, t: Translate): string {
  const key = TYPE_LABEL_KEYS[type];
  return key ? t(key) : type;
}

export function getReportTypeDescription(type: string, t: Translate): string {
  const key = TYPE_DESC_KEYS[type];
  return key ? t(key) : '';
}
