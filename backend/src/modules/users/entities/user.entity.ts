export class UserEntity {
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
  password: string;
  email: string;
  idRole: number;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;

  role?: {
    id: number;
    name: string;
    slug: string;
  };
}
