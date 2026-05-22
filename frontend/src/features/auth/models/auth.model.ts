export interface User {
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
  email: string | null;
  idRole: number;
  available: boolean;
  role?: {
    id: number;
    name: string;
    slug: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}
