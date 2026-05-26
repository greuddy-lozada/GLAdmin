export interface Withholding {
  id: number;
  idSupplier: number;
  idPurchaseOrder?: number | null;
  type: string;
  percentage: number;
  baseAmount: number;
  baseAmountUsd?: number | null;
  withheldAmount: number;
  withheldAmountUsd?: number | null;
  exchangeRate?: number | null;
  documentNumber?: string | null;
  period?: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: { id: number; companyName: string };
  purchaseOrder?: { id: number; code?: string | null } | null;
}

export interface CreateWithholdingRequest {
  idSupplier: number;
  idPurchaseOrder?: number;
  type: string;
  percentage: number;
  baseAmount: number;
  baseAmountUsd?: number;
  withheldAmount?: number;
  withheldAmountUsd?: number;
  exchangeRate?: number;
  documentNumber?: string;
  period?: string;
}

export interface UpdateWithholdingRequest {
  idSupplier?: number;
  idPurchaseOrder?: number;
  type?: string;
  percentage?: number;
  baseAmount?: number;
  baseAmountUsd?: number;
  withheldAmount?: number;
  withheldAmountUsd?: number;
  exchangeRate?: number;
  documentNumber?: string;
  period?: string;
}
