export interface Batch {
  id: string;
  code: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchRequest {
  code: string;
  description?: string | null;
}

export interface UpdateBatchRequest {
  code?: string;
  description?: string | null;
}
