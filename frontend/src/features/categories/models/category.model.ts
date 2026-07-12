export interface Category {
  id: string;
  name: string;
  description?: string;
  idParent?: string;
  parent?: { id: string; name: string };
  children?: { id: string; name: string }[];
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  idParent?: string;
}
