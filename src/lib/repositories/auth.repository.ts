import { supabase } from '../supabase';

export class AuthRepository {
  async authenticate(email: string, password: string): Promise<{ data: any, error: any }> {
    return supabase.rpc('authenticate_user', {
      p_email: email,
      p_password: password
    });
  }

  async register(data: { full_name: string; email: string; password: string; phone?: string; role: string }): Promise<{ data: any, error: any }> {
    return supabase.rpc('register_user', {
        p_full_name: data.full_name,
        p_email: data.email,
        p_password: data.password,
        p_phone: data.phone,
        p_role: data.role
    });
  }

  async updatePassword(currentPass: string, newPass: string, sessionId: string): Promise<{ data: any, error: any }> {
    return supabase.rpc('update_user_password', {
        p_current_password: currentPass,
        p_new_password: newPass
    }).setHeader('x-session-id', sessionId);
  }

  async requestPasswordReset(email: string, reason: string, riskLevel: string): Promise<{ data: any, error: any }> {
    return supabase.rpc('request_password_reset', {
        p_email: email,
        p_reason: reason,
        p_risk_level: riskLevel
    });
  }

  async approvePasswordReset(userId: string, tempPassword: string, sessionId: string): Promise<{ data: any, error: any }> {
    return supabase.rpc('approve_password_reset', {
        p_user_id: userId,
        p_temp_password: tempPassword
    }).setHeader('x-session-id', sessionId);
  }

  async denyPasswordReset(userId: string, reason: string, sessionId: string): Promise<{ data: any, error: any }> {
    return supabase.rpc('deny_password_reset', {
        p_user_id: userId,
        p_reason: reason
    }).setHeader('x-session-id', sessionId);
  }

  async updatePreferences(preferences: object, sessionId: string): Promise<{ data: any, error: any }> {
    return supabase.rpc('update_user_preferences', {
        p_preferences: preferences
    }).setHeader('x-session-id', sessionId);
  }
}

export const authRepository = new AuthRepository();
