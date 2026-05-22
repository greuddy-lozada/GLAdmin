export class UserEntity {
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
  password: string;
  email: string | null;
  idRole: number;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;

  role?: {
    id: number;
    name: string;
    slug: string;
  };
}
