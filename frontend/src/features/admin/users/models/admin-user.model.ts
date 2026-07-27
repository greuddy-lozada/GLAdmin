export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  idRole: string;
  isActive: boolean;
  mustChangePassword: boolean;
  role?: { id: string; name: string; slug: string; type?: string; level?: number };
  organizations?: { organization: { id: string; name: string; slug: string }; role: { id: string; name: string; slug: string } }[];
}

export interface CreateAdminUserRequest {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  idRole: string;
  password: string;
  isActive?: boolean;
  organizationId?: string;
  orgRoleId?: string;
}

export interface UpdateAdminUserRequest {
  isActive?: boolean;
  roleId?: string;
}
