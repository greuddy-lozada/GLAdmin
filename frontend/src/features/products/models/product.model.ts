export interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  dollarPrice?: number;
  idTax?: number;
  observation?: string;
  image?: string;
  available: boolean;
  tax?: {
    id: number;
    name: string;
    percentage: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  code: string;
  name: string;
  price: number;
  dollarPrice?: number;
  idTax?: number;
  observation?: string;
  image?: string;
}

export interface UpdateProductRequest {
  code?: string;
  name?: string;
  price?: number;
  dollarPrice?: number;
  idTax?: number;
  observation?: string;
  image?: string;
  available?: boolean;
}
