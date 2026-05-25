export interface Supplier {
  id: number;
  documentNumber: string;
  companyName: string;
  businessName?: string | null;
  fiscalAddress?: string | null;
  taxId?: string | null;
  taxWithholdingAgent: boolean;
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
  businessName?: string;
  fiscalAddress?: string;
  taxId?: string;
  taxWithholdingAgent?: boolean;
  firstName?: string;
  lastName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
}

export interface UpdateSupplierRequest {
  documentNumber?: string;
  companyName?: string;
  businessName?: string;
  fiscalAddress?: string;
  taxId?: string;
  taxWithholdingAgent?: boolean;
  firstName?: string;
  lastName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  available?: boolean;
}
