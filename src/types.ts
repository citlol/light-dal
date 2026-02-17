// Type definitions for our API

export interface User {
  id: number;
  username: string;
  email: string;
  age: number | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  age?: number;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  age?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface UsersResponse {
  success: boolean;
  count: number;
  users: User[];
}

export interface UserResponse {
  success: boolean;
  user: User;
}

export interface ErrorResponse {
  success: false;
  message: string;
  required?: string[];
}