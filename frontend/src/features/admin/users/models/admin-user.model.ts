export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  idRole: string;
  isActive: boolean;
  mustChangePassword: boolean;
  role?: { id: string; name: string; slug: string };
  organizations?: { organization: { id: string; name: string; slug: string }; role: { id: string; name: string; slug: string } }[];
}

export interface UpdateAdminUserRequest {
  isActive?: boolean;
  roleId?: string;
}
