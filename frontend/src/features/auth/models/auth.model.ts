export interface User {
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  idRole: number;
  isActive: boolean;
  mustChangePassword: boolean;
  role?: {
    id: number;
    name: string;
    slug: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
