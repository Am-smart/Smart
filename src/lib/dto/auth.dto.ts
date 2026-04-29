import { UserRole, ResetRequest } from '../types';

export interface UserDTO {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  created_at: string;
  active?: boolean;
  notification_preferences?: Record<string, boolean>;
  metadata?: Record<string, string | number | boolean>;
  flagged?: boolean;
  failed_attempts?: number;
  lockouts?: number;
  locked_until?: string | null;
  reset_request?: ResetRequest | null;
  sessionId?: string;
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
