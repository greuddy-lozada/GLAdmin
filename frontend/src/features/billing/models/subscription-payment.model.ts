export interface SystemPagoMovilConfig {
  pagoMovil: {
    phoneNumber: string | null;
    bankId: string | null;
    idNumber: string | null;
  };
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  label: string;
  amount: number;
}

export interface SubscriptionPayment {
  id: number;
  organizationId: number;
  planId: number;
  method: 'pago_movil' | 'cash_usd';
  amountUsd: number;
  status: 'pending' | 'approved' | 'rejected';
  bankId?: string | null;
  phoneNumber?: string | null;
  reference?: string | null;
  proofImage?: string | null;
  reviewedBy?: number | null;
  reviewedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  plan: SubscriptionPlan;
  organization?: { id: number; name: string; slug: string };
  reviewer?: { id: number; firstName: string; lastName: string } | null;
}

export interface CreateSubscriptionPaymentRequest {
  planId: number;
  method: 'pago_movil' | 'cash_usd';
  bankId?: string;
  phoneNumber?: string;
  reference?: string;
  proofImage?: string;
}

export interface ReviewSubscriptionPaymentRequest {
  status: 'approved' | 'rejected';
  notes?: string;
}
