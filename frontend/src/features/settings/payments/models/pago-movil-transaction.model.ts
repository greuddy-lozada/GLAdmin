export interface PagoMovilTransaction {
  id: string;
  organizationId: string;
  userId: string;
  amountVes: number;
  amountUsd: number;
  bankId: string;
  phoneNumber: string;
  reference: string;
  proofImage?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; firstName: string; lastName: string };
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
