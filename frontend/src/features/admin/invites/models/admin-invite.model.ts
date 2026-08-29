export interface AdminInvite {
  id: string;
  code: string;
  email: string;
  organizationId: string;
  roleId: string;
  invitedById: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
  emailSent?: boolean;
  inviteUrl?: string;
  organization?: { id: string; name: string; slug: string };
  role?: { id: string; name: string; slug: string };
  invitedBy?: { id: string; firstName: string; lastName: string };
}

export interface CreateAdminInviteRequest {
  email: string;
  organizationId: string;
  roleId: string;
}
