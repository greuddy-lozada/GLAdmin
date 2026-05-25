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
  exchangeRate?: number;
  exchangeRateId?: number;
  paymentMethod?: number;
  status?: number;
  createdAt: string;
  updatedAt: string;
  supplier?: { id: number; companyName: string; documentNumber: string };
  details?: (PurchaseOrderDetail & { id: number; product?: { id: number; code: string; name: string } })[];
}

export interface CreatePurchaseOrderRequest {
  idSupplier: number;
  code?: string;
  date?: string;
  amount?: number;
  amountUsd?: number;
  exchangeRate?: number;
  exchangeRateId?: number;
  paymentMethod?: number;
  status?: number;
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
  exchangeRate?: number;
  exchangeRateId?: number;
  paymentMethod?: number;
  status?: number;
}
