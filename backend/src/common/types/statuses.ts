export const SaleStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  ANNULLED: 'ANNULLED',
} as const;

export type SaleStatus = (typeof SaleStatus)[keyof typeof SaleStatus];

export const SALE_STATUS_META: Record<
  SaleStatus,
  {
    label: string;
    isMutable: boolean;
    isFinancial: boolean;
  }
> = {
  DRAFT: { label: 'Borrador', isMutable: true, isFinancial: false },
  ISSUED: { label: 'Emitida', isMutable: false, isFinancial: true },
  ANNULLED: { label: 'Anulada', isMutable: false, isFinancial: true },
};

export const PurchaseOrderStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  RECEIVED: 'RECEIVED',
  ANNULLED: 'ANNULLED',
} as const;

export type PurchaseOrderStatus =
  (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

export const PURCHASE_ORDER_STATUS_META: Record<
  PurchaseOrderStatus,
  {
    label: string;
    isMutable: boolean;
  }
> = {
  DRAFT: { label: 'Borrador', isMutable: true },
  ISSUED: { label: 'Emitida', isMutable: false },
  RECEIVED: { label: 'Recibida', isMutable: false },
  ANNULLED: { label: 'Anulada', isMutable: false },
};
