export interface Category {
  id: number;
  name: string;
  description?: string;
  idParent?: number;
  parent?: { id: number; name: string };
  children?: { id: number; name: string }[];
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  idParent?: number;
}
