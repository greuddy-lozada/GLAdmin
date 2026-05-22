import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
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

  @Exclude()
  password: string;
}
