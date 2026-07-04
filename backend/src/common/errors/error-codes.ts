export const ErrorCodes = {
  // Auth
  AUTH_001: { code: 'AUTH_001', message: 'auth.error.invalidCredentials' },
  AUTH_002: { code: 'AUTH_002', message: 'auth.error.tokenExpired' },
  AUTH_003: { code: 'AUTH_003', message: 'auth.error.accountLocked' },

  // Users
  USER_001: { code: 'USER_001', message: 'users.error.emailExists' },
  USER_002: { code: 'USER_002', message: 'users.error.notInOrganization' },

  // Products
  PRODUCT_001: { code: 'PRODUCT_001', message: 'products.error.codeDuplicate' },
  PRODUCT_002: { code: 'PRODUCT_002', message: 'products.error.hasSales' },

  // Customers
  CUSTOMER_001: { code: 'CUSTOMER_001', message: 'customers.error.rifExists' },

  // Sales
  SALE_001: { code: 'SALE_001', message: 'sales.error.issuedImmutable' },
  SALE_002: { code: 'SALE_002', message: 'sales.error.notFound' },
  SALE_003: { code: 'SALE_003', message: 'sales.error.noItems' },

  // Purchase Orders
  PO_001: { code: 'PO_001', message: 'purchaseOrders.error.receivedImmutable' },
  PO_002: { code: 'PO_002', message: 'purchaseOrders.error.notFound' },
  PO_003: { code: 'PO_003', message: 'purchaseOrders.error.alreadyReceived' },
  PO_004: {
    code: 'PO_004',
    message: 'purchaseOrders.error.notWithholdingAgent',
  },
  PO_005: {
    code: 'PO_005',
    message: 'purchaseOrders.error.missingWithholdingPct',
  },
  PO_006: {
    code: 'PO_006',
    message: 'purchaseOrders.error.missingWithholdingProof',
  },
  PO_007: { code: 'PO_007', message: 'purchaseOrders.error.detailNotFound' },
  PO_008: { code: 'PO_008', message: 'purchaseOrders.error.quantityExceeded' },

  // Taxes
  TAX_001: {
    code: 'TAX_001',
    message: 'taxes.error.withholdingAlreadyApplied',
  },
  TAX_002: { code: 'TAX_002', message: 'taxes.error.withholdingExceedsLimit' },

  // Accounting
  ACCT_001: { code: 'ACCT_001', message: 'accounting.error.unbalanced' },
  ACCT_002: { code: 'ACCT_002', message: 'accounting.error.periodClosed' },
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

export function getErrorInfo(code: ErrorCode) {
  return ErrorCodes[code];
}
