export interface AdminInvite {
  id: number;
  code: string;
  email: string;
  organizationId: number;
  roleId: number;
  invitedById: number;
  used: boolean;
  expiresAt: string;
  createdAt: string;
  organization?: { id: number; name: string; slug: string };
  role?: { id: number; name: string; slug: string };
  invitedBy?: { id: number; firstName: string; lastName: string };
}

export interface CreateAdminInviteRequest {
  email: string;
  organizationId: number;
  roleId: number;
}
