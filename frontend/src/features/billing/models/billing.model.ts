export interface Plan {
  id: string;
  name: string;
  label: string;
  amount: number;
  currency: string;
  interval: string;
  features: string;
  maxUsers: number;
  isActive: boolean;
}

export interface CreateCheckoutSessionResponse {
  url: string;
  sessionId: string;
}
