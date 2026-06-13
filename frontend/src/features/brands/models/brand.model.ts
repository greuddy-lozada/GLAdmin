export interface Brand {
  id: number;
  name: string;
  description?: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandRequest {
  name: string;
  description?: string;
}
