import { Builder } from './base.builder';

export interface ProductData {
  name: string;
  price: number;
  cost?: number;
  categoryId?: number;
  brandId?: number;
  taxId?: number;
}

export class ProductBuilder extends Builder<ProductData> {
  private data: Partial<ProductData> = {};

  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  withPrice(price: number): this {
    this.data.price = price;
    return this;
  }

  withCost(cost: number): this {
    this.data.cost = cost;
    return this;
  }

  withCategory(id: number): this {
    this.data.categoryId = id;
    return this;
  }

  withBrand(id: number): this {
    this.data.brandId = id;
    return this;
  }

  withTax(id: number): this {
    this.data.taxId = id;
    return this;
  }

  build(): ProductData {
    return {
      name: this.data.name ?? `Test Product ${Date.now()}`,
      price: this.data.price ?? 100,
      cost: this.data.cost,
      categoryId: this.data.categoryId,
      brandId: this.data.brandId,
      taxId: this.data.taxId,
    };
  }
}
