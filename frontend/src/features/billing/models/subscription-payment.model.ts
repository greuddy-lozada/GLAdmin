export interface SystemPagoMovilConfig {
  pagoMovil: {
    phoneNumber: string | null;
    bankId: string | null;
    idNumber: string | null;
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  label: string;
  amount: number;
}

export interface SubscriptionPayment {
  id: string;
  organizationId: string;
  planId: string;
  method: 'pago_movil' | 'cash_usd';
  amountUsd: number;
  status: 'pending' | 'approved' | 'rejected';
  bankId?: string | null;
  phoneNumber?: string | null;
  reference?: string | null;
  proofImage?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  plan: SubscriptionPlan;
  organization?: { id: string; name: string; slug: string };
  reviewer?: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateSubscriptionPaymentRequest {
  planId: string;
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
