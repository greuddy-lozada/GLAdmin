import { Builder } from './base.builder';

export interface SaleItem {
  productName: string;
  quantity: number;
}

export interface SaleData {
  customerName?: string;
  items: SaleItem[];
  paymentMethod: 'pago_movil' | 'cash_usd' | 'cash_ved';
}

export class SaleBuilder extends Builder<SaleData> {
  private data: Partial<SaleData> = { items: [] };

  withCustomer(name: string): this {
    this.data.customerName = name;
    return this;
  }

  addItem(productName: string, quantity: number): this {
    this.data.items!.push({ productName, quantity });
    return this;
  }

  withPayment(method: SaleData['paymentMethod']): this {
    this.data.paymentMethod = method;
    return this;
  }

  build(): SaleData {
    return {
      customerName: this.data.customerName,
      items: this.data.items ?? [],
      paymentMethod: this.data.paymentMethod ?? 'cash_ved',
    };
  }
}
