export interface PurchaseOrderDetail {
  id: string;
  idProduct: string;
  quantity?: number;
  receivedQuantity?: number;
  unitPrice?: number;
  unitPriceUsd?: number;
  subtotal?: number;
  subtotalUsd?: number;
  observation?: string;
}

export interface PurchaseOrder {
  id: string;
  idSupplier: string;
  code?: string;
  date?: string;
  amount?: number;
  amountUsd?: number;
  baseAmount?: number;
  baseAmountUsd?: number;
  ivaAmount?: number;
  ivaAmountUsd?: number;
  exchangeRate?: number;
  exchangeRateId?: string;
  exchangeRateDayId?: string;
  officialExchangeRate?: number;
  officialExchangeRateId?: string;
  paymentMethod?: number;
  status?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  supplier?: { id: string; companyName: string; taxWithholdingAgent?: boolean };
  details?: (PurchaseOrderDetail & { id: string; product?: { id: string; code: string; name: string; taxPercentage?: number } })[];
  withholdingRecords?: { id: string; percentage: number; withheldAmount: number; withheldAmountUsd?: number; withholdingProof?: string }[];
}

export interface CreatePurchaseOrderRequest {
  idSupplier: string;
  code?: string;
  date?: string;
  amount?: number;
  amountUsd?: number;
  baseAmount?: number;
  baseAmountUsd?: number;
  ivaAmount?: number;
  ivaAmountUsd?: number;
  exchangeRate?: number;
  exchangeRateDayId?: string;
  officialExchangeRate?: number;
  officialExchangeRateId?: string;
  paymentMethod?: number;
  status?: string;
  applyWithholding?: boolean;
  withholdingPercentage?: number;
  withholdingProof?: string;
  details?: {
    idProduct: string;
    quantity?: number;
    unitPrice?: number;
    unitPriceUsd?: number;
    subtotal?: number;
    subtotalUsd?: number;
    observation?: string;
  }[];
}

export interface UpdatePurchaseOrderRequest {
  idSupplier?: string;
  code?: string;
  date?: string;
  amount?: number;
  amountUsd?: number;
  baseAmount?: number;
  baseAmountUsd?: number;
  ivaAmount?: number;
  ivaAmountUsd?: number;
  exchangeRate?: number;
  exchangeRateDayId?: string;
  officialExchangeRate?: number;
  officialExchangeRateId?: string;
  paymentMethod?: number;
  status?: string;
  applyWithholding?: boolean;
  withholdingPercentage?: number;
  withholdingProof?: string;
  details?: {
    idProduct: string;
    quantity?: number;
    unitPrice?: number;
    unitPriceUsd?: number;
    subtotal?: number;
    subtotalUsd?: number;
    observation?: string;
  }[];
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  RECEIVED = 'RECEIVED',
  ANNULLED = 'ANNULLED',
}

export const PURCHASE_ORDER_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  [PurchaseOrderStatus.DRAFT]: [PurchaseOrderStatus.ISSUED, PurchaseOrderStatus.ANNULLED],
  [PurchaseOrderStatus.ISSUED]: [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.ANNULLED],
  [PurchaseOrderStatus.RECEIVED]: [],
  [PurchaseOrderStatus.ANNULLED]: [],
};
