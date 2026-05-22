export interface Supplier {
  id: number;
  documentNumber: string;
  companyName: string;
  firstName?: string | null;
  lastName?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  documentNumber: string;
  companyName: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
}

export interface UpdateSupplierRequest {
  documentNumber?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  available?: boolean;
}
