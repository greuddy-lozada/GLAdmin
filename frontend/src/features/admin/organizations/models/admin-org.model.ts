export interface AdminOrg {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  plan?: { id: string; name: string; label: string } | null;
  _count?: { userMemberships: number };
}

export interface CreateAdminOrgRequest {
  name: string;
  slug?: string;
  planId?: string;
  isActive?: boolean;
}

export interface UpdateAdminOrgRequest {
  name?: string;
  slug?: string;
  planId?: string;
  isActive?: boolean;
}
