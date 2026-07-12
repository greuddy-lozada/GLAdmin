export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  dollarPrice?: number;
  baseCost?: number;
  margin: number;
  idTax?: string;
  idBrand?: string;
  idCategory?: string;
  brand?: { id: string; name: string };
  category?: { id: string; name: string };
  observation?: string;
  image?: string;
  available: boolean;
  stock?: number;
  tax?: {
    id: string;
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
  idTax?: string;
  idBrand?: string;
  idCategory?: string;
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
  idTax?: string;
  idBrand?: string;
  idCategory?: string;
  observation?: string;
  image?: string;
  available?: boolean;
}
