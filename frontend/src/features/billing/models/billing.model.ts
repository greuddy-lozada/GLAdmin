export interface Plan {
  id: number;
  name: string;
  label: string;
  amount: number;
  currency: string;
  interval: string;
  features: string;
  maxUsers: number;
  isActive: boolean;
}

export interface OrganizationPlan {
  id: number;
  name: string;
  label?: string;
}

export interface CreateCheckoutSessionResponse {
  url: string;
  sessionId: string;
}
