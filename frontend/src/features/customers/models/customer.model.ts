export interface Customer {
  id: number;
  idCardNumber: string;
  firstName: string;
  lastName: string;
  address?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  available: boolean;
  isWithholdingAgent: boolean;
  withholdingPercentage?: number | null;
  withholdingProof?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  idCardNumber: string;
  firstName: string;
  lastName: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  isWithholdingAgent?: boolean;
  withholdingPercentage?: number;
  withholdingProof?: string;
}

export interface UpdateCustomerRequest {
  idCardNumber?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  available?: boolean;
  isWithholdingAgent?: boolean;
  withholdingPercentage?: number;
  withholdingProof?: string;
}
