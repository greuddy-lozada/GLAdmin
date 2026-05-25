export interface User {
  id: number;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  idRole: number;
  isActive: boolean;
  role?: {
    id: number;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  userName: string;
  password: string;
  email: string;
  idRole: number;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  userName?: string;
  password?: string;
  email?: string;
  idRole?: number;
  isActive?: boolean;
}
