export interface Customer {
  id: number;
  idCardNumber: string;
  firstName: string;
  lastName: string;
  address?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  available: boolean;
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
}

export interface UpdateCustomerRequest {
  idCardNumber?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  available?: boolean;
}
