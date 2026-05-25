export class LoginResponseDto {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    role?: {
      id: number;
      name: string;
      slug: string;
    };
    isActive: boolean;
    mustChangePassword: boolean;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
