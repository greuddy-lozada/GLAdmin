export interface Company {
  id: number;
  taxId: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  website?: string | null;
  isWithholdingAgent: boolean;
  withholdingPercentage?: number;
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
  isWithholdingAgent?: boolean;
  withholdingPercentage?: number;
}

export interface UpdateCompanyRequest {
  taxId?: string;
  name?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  website?: string | null;
  isWithholdingAgent?: boolean;
  withholdingPercentage?: number;
}
