export interface Tax {
  id: number;
  name: string;
  percentage: number;
  formula?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxRequest {
  name: string;
  percentage: number;
  formula?: string | null;
}

export interface UpdateTaxRequest {
  name?: string;
  percentage?: number;
  formula?: string | null;
}
