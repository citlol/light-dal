// Type definitions for our API

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      MONGODB_URI: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
    }
  }
}

export {};
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
  users: any[]; // Will be IUser[] from Mongoose
}

export interface UserResponse {
  success: true;
  message?: string;
  user: any; // Will be IUser from Mongoose
}

export interface ErrorResponse {
  success: false;
  message: string;
  required?: string[];
}