import { UserRole } from '../types';

export interface UserDTO {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  xp?: number;
  level?: number;
  phone?: string;
  created_at: string;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AuthResponseDTO {
  success: boolean;
  user: UserDTO | null;
  sessionId: string | null;
  error?: string | null;
}

export interface LoginRequestDTO {
  email: string;
  password?: string;
}

export interface SignupRequestDTO {
  email: string;
  password?: string;
  full_name: string;
  role?: UserRole;
  phone?: string;
}
