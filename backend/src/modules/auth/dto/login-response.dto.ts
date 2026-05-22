export class LoginResponseDto {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    userName: string;
    email: string | null;
    role?: {
      id: number;
      name: string;
      slug: string;
    };
    available: boolean;
  };
  token: string;
}
