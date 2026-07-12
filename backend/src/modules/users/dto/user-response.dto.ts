import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string | null;
  idRole: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;

  role?: {
    id: string;
    name: string;
    slug: string;
  };

  @Exclude()
  password: string;
}
