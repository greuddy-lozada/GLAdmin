import { Builder } from './base.builder';

export interface CustomerData {
  name: string;
  rif: string;
  email?: string;
  phone?: string;
}

export class CustomerBuilder extends Builder<CustomerData> {
  private data: Partial<CustomerData> = {};

  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  withRif(rif: string): this {
    this.data.rif = rif;
    return this;
  }

  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  withPhone(phone: string): this {
    this.data.phone = phone;
    return this;
  }

  build(): CustomerData {
    const ts = Date.now();
    return {
      name: this.data.name ?? `Test Customer ${ts}`,
      rif: this.data.rif ?? `J-${String(ts).slice(-9)}-1`,
      email: this.data.email ?? `customer${ts}@test.com`,
      phone: this.data.phone,
    };
  }
}
