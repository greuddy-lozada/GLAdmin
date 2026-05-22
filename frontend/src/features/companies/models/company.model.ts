export interface Company {
  id: number;
  documentNumber: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  website?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyRequest {
  documentNumber: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  website?: string | null;
}

export interface UpdateCompanyRequest {
  documentNumber?: string;
  name?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  website?: string | null;
}
