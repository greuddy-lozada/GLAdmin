export class UserEntity {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  password: string;
  email: string;
  idRole: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin: Date | null;
  currentOrganizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;

  role?: {
    id: string;
    name: string;
    slug: string;
  };
}
