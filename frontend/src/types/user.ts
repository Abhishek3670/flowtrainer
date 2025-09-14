export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'viewer';
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: 'admin' | 'user' | 'viewer';
  status?: 'active' | 'inactive' | 'suspended';
  password?: string;
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
