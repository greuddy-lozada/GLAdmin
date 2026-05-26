export interface PagoMovilConfig {
  id: number;
  organizationId: number;
  phoneNumber: string;
  bankId: string;
  idNumber: string;
  exchangeRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePagoMovilConfigRequest {
  phoneNumber: string;
  bankId: string;
  idNumber: string;
  exchangeRate: number;
}

export interface UpdatePagoMovilConfigRequest {
  phoneNumber?: string;
  bankId?: string;
  idNumber?: string;
  exchangeRate?: number;
  isActive?: boolean;
}
