export interface Stock {
  id: number;
  idProduct: number;
  idSupplier?: number;
  idBatch?: number;
  existence: number;
  available: boolean;
  product?: {
    id: number;
    code: string;
    name: string;
  };
  supplier?: {
    id: number;
    companyName: string;
  };
  batch?: {
    id: number;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockRequest {
  idProduct: number;
  idSupplier?: number;
  idBatch?: number;
  existence: number;
}

export interface UpdateStockRequest {
  idProduct?: number;
  idSupplier?: number;
  idBatch?: number;
  existence?: number;
  available?: boolean;
}
