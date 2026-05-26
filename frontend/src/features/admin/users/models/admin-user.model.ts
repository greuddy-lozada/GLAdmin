export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  idRole: number;
  isActive: boolean;
  mustChangePassword: boolean;
  role?: { id: number; name: string; slug: string };
  organizations?: { organization: { id: number; name: string; slug: string }; role: { id: number; name: string; slug: string } }[];
}

export interface UpdateAdminUserRequest {
  isActive?: boolean;
  roleId?: number;
}
