export interface AdminPlan {
  id: number;
  name: string;
  label: string;
  amount: number;
  currency: string;
  interval: string;
  features: string;
  maxUsers: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminPlanRequest {
  name: string;
  label: string;
  amount: number;
  currency?: string;
  interval: string;
  features?: string;
  maxUsers?: number;
  isActive?: boolean;
}

export interface UpdateAdminPlanRequest {
  name?: string;
  label?: string;
  amount?: number;
  currency?: string;
  interval?: string;
  features?: string;
  maxUsers?: number;
  isActive?: boolean;
}
