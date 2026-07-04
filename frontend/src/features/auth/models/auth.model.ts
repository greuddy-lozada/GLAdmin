export interface User {
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  idRole: number;
  isActive: boolean;
  mustChangePassword: boolean;
  role?: {
    id: number;
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
  id: number;
  name: string;
  slug: string;
  plan: { name: string; label: string } | null;
  role: string;
}

export interface OrganizationDetail {
  id: number;
  name: string;
  slug: string;
  plan: { name: string; label: string; features: string } | null;
  subscriptionStatus: 'inactive' | 'active' | 'past_due';
  subscriptionExpiresAt: string | null;
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
