export interface Company {
  id: number;
  taxId: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  website?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyRequest {
  taxId: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  website?: string | null;
}

export interface UpdateCompanyRequest {
  taxId?: string;
  name?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  website?: string | null;
}
