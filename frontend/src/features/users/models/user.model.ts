export interface User {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  idRole: string;
  isActive: boolean;
  role?: {
    id: string;
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
  idRole: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  userName?: string;
  password?: string;
  email?: string;
  idRole?: string;
  isActive?: boolean;
}
