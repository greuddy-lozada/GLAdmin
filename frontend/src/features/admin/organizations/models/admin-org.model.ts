export interface AdminOrg {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  plan?: { id: number; name: string; label: string } | null;
  _count?: { userMemberships: number };
}

export interface CreateAdminOrgRequest {
  name: string;
  slug?: string;
  planId?: number;
  isActive?: boolean;
}

export interface UpdateAdminOrgRequest {
  name?: string;
  slug?: string;
  planId?: number;
  isActive?: boolean;
}
