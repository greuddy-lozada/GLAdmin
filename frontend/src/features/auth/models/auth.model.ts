export interface User {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  idRole: string;
  isActive: boolean;
  mustChangePassword: boolean;
  role?: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  plan: { name: string; label: string } | null;
  role: string;
}

export interface OrganizationDetail {
  id: string;
  name: string;
  slug: string;
  plan: { name: string; label: string; features: string } | null;
  subscriptionStatus: 'inactive' | 'active' | 'past_due';
  subscriptionExpiresAt: string | null;
  /** Org membership role slug (executive/manager/employee). */
  role?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  organizations?: OrganizationInfo[];
  organization?: OrganizationDetail;
}

export interface SelectOrgResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  organization: OrganizationDetail;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
