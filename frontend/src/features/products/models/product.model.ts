export interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  dollarPrice?: number;
  baseCost?: number;
  margin: number;
  idTax?: number;
  idBrand?: number;
  idCategory?: number;
  brand?: { id: number; name: string };
  category?: { id: number; name: string };
  observation?: string;
  image?: string;
  available: boolean;
  stock?: number;
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
  baseCost?: number;
  margin?: number;
  idTax?: number;
  idBrand?: number;
  idCategory?: number;
  observation?: string;
  image?: string;
}

export interface UpdateProductRequest {
  code?: string;
  name?: string;
  price?: number;
  dollarPrice?: number;
  baseCost?: number;
  margin?: number;
  idTax?: number;
  idBrand?: number;
  idCategory?: number;
  observation?: string;
  image?: string;
  available?: boolean;
}
