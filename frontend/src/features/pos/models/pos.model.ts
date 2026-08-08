export enum PaymentMethod {
  Cash = 1,
  PagoMovil = 2,
  Transfer = 3,
  Card = 4,
  Mixed = 5,
  Credit = 6,
}

export interface CartItem {
  productId: string;
  name: string;
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

export interface SaleItem {
  productId: string;
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

export interface SalePayment {
  method: PaymentMethod;
  amount: number;
  currency: 'VES' | 'USD';
}

export type PaymentLine = SalePayment;

export interface CreateSaleRequest {
  code: string;
  date: string;
  amount: number;
  amountUsd: number;
  exchangeRate: number;
  paymentMethod: PaymentMethod;
  status: number;
  idCustomer?: string;
  customerName?: string;
  items: SaleItem[];
  totalTax?: number;
  totalTaxUsd?: number;
  withholdingPercentage?: number;
  withholdingAmount?: number;
  withholdingAmountUsd?: number;
  registerSessionId?: string;
  payments?: SalePayment[];
}

export interface ParkedOrder {
  id?: number;
  label: string;
  cartItems: CartItem[];
  customerId?: string;
  customerName?: string;
  total: number;
  totalUsd: number;
  totalTax: number;
  totalTaxUsd: number;
  createdAt: string;
}
