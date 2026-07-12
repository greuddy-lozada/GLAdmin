export class LoginResponseDto {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    role?: {
      id: string;
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
