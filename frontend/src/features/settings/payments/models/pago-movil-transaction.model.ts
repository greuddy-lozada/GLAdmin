export interface PagoMovilTransaction {
  id: number;
  organizationId: number;
  userId: number;
  amountVes: number;
  amountUsd: number;
  bankId: string;
  phoneNumber: string;
  reference: string;
  proofImage?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: number | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; firstName: string; lastName: string };
}

export interface CreatePagoMovilTransactionRequest {
  amountVes: number;
  amountUsd: number;
  bankId: string;
  phoneNumber: string;
  reference: string;
  proofImage?: string;
}

export interface ReviewPagoMovilTransactionRequest {
  status: 'approved' | 'rejected';
  notes?: string;
}
