export interface PurchaseOrderDetail {
  idProduct: number;
  quantity?: number;
  unitPrice?: number;
  unitPriceUsd?: number;
  subtotal?: number;
  subtotalUsd?: number;
  observation?: string;
}

export interface PurchaseOrder {
  id: number;
  idSupplier: number;
  code?: string;
  date?: string;
  amount?: number;
  amountUsd?: number;
  baseAmount?: number;
  baseAmountUsd?: number;
  ivaAmount?: number;
  ivaAmountUsd?: number;
  exchangeRate?: number;
  exchangeRateId?: number;
  exchangeRateDayId?: number;
  officialExchangeRate?: number;
  officialExchangeRateId?: number;
  paymentMethod?: number;
  status?: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  supplier?: { id: number; companyName: string; taxWithholdingAgent?: boolean };
  details?: (PurchaseOrderDetail & { id: number; product?: { id: number; code: string; name: string; taxPercentage?: number } })[];
  withholdingRecords?: { id: number; percentage: number; withheldAmount: number; withheldAmountUsd?: number; withholdingProof?: string }[];
}

export interface CreatePurchaseOrderRequest {
  idSupplier: number;
  code?: string;
  date?: string;
  amount?: number;
  amountUsd?: number;
  baseAmount?: number;
  baseAmountUsd?: number;
  ivaAmount?: number;
  ivaAmountUsd?: number;
  exchangeRate?: number;
  exchangeRateDayId?: number;
  officialExchangeRate?: number;
  officialExchangeRateId?: number;
  paymentMethod?: number;
  status?: number;
  applyWithholding?: boolean;
  withholdingPercentage?: number;
  withholdingProof?: string;
  details?: {
    idProduct: number;
    quantity?: number;
    unitPrice?: number;
    unitPriceUsd?: number;
    subtotal?: number;
    subtotalUsd?: number;
    observation?: string;
  }[];
}

export interface UpdatePurchaseOrderRequest {
  idSupplier?: number;
  code?: string;
  date?: string;
  amount?: number;
  amountUsd?: number;
  baseAmount?: number;
  baseAmountUsd?: number;
  ivaAmount?: number;
  ivaAmountUsd?: number;
  exchangeRate?: number;
  exchangeRateDayId?: number;
  officialExchangeRate?: number;
  officialExchangeRateId?: number;
  paymentMethod?: number;
  status?: number;
  applyWithholding?: boolean;
  withholdingPercentage?: number;
  withholdingProof?: string;
  details?: {
    idProduct: number;
    quantity?: number;
    unitPrice?: number;
    unitPriceUsd?: number;
    subtotal?: number;
    subtotalUsd?: number;
    observation?: string;
  }[];
}

export enum PurchaseOrderStatus {
  Draft = 1,
  Sent = 2,
  Approved = 3,
  Received = 4,
  Cancelled = 5,
}

export const PURCHASE_ORDER_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  [PurchaseOrderStatus.Draft]: [PurchaseOrderStatus.Sent, PurchaseOrderStatus.Cancelled],
  [PurchaseOrderStatus.Sent]: [PurchaseOrderStatus.Approved, PurchaseOrderStatus.Cancelled],
  [PurchaseOrderStatus.Approved]: [PurchaseOrderStatus.Received, PurchaseOrderStatus.Cancelled],
  [PurchaseOrderStatus.Received]: [],
  [PurchaseOrderStatus.Cancelled]: [],
};
