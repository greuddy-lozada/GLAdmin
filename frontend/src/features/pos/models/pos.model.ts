export enum PaymentMethod {
  Cash = 1,
  PagoMovil = 2,
  Transfer = 3,
  Card = 4,
}

export interface SaleItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  unitPriceUsd: number;
  subtotal: number;
  subtotalUsd: number;
  taxName?: string;
  taxPercentage?: number;
  taxAmount?: number;
  taxAmountUsd?: number;
}

export interface CreateSaleRequest {
  code: string;
  date: string;
  amount: number;
  amountUsd: number;
  exchangeRate: number;
  paymentMethod: PaymentMethod;
  status: number;
  idCustomer?: number;
  customerName?: string;
  items: SaleItem[];
  totalTax?: number;
  totalTaxUsd?: number;
}
