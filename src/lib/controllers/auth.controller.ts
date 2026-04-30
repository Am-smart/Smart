import { authService } from '../services/auth.service';
import { LoginRequestDTO, SignupRequestDTO, AuthResponseDTO } from '../dto/auth.dto';
import { validateSignupForm, normalizeEmail, normalizeInput, validateLoginForm } from '../validation';
import { User } from '../types';
import { recordAttempt, isRateLimited, resetRateLimit } from '../rate-limit';

export class AuthController {
  async login(credentials: LoginRequestDTO): Promise<Omit<AuthResponseDTO, 'success'>> {
    const validation = validateLoginForm(credentials.email, credentials.password || '');
    if (!validation.isValid) {
      return { user: null, sessionId: null, error: validation.errors[0].message };
    }

    const normalizedEmail = normalizeEmail(credentials.email);
    if (await isRateLimited(normalizedEmail)) {
        return { user: null, sessionId: null, error: 'Too many login attempts. Please try again later.' };
    }

    const { data: rawData, error: rpcError } = await authService.authenticate(normalizedEmail, credentials.password || '');

    if (rpcError) return { user: null, sessionId: null, error: 'Authentication service unavailable' };

    const result = rawData as { success: boolean, user: User, session_id: string, error?: string };
    if (!result.success) {
      if (result.error === 'Invalid email or password') await recordAttempt(normalizedEmail);
      return { user: null, sessionId: null, error: result.error };
    }

    await resetRateLimit(normalizedEmail);
    const user = result.user;
    const sessionId = result.session_id;

    const { UserMapper } = await import('../mappers');
    return {
      user: UserMapper.toDTO(user),
      sessionId: sessionId
    };
  }

  async signup(data: SignupRequestDTO): Promise<Omit<AuthResponseDTO, 'success'>> {
    const validation = validateSignupForm(
      data.full_name,
      data.email,
      data.password || '',
      data.password || '',
      data.phone
    );

    if (!validation.isValid) {
      return { user: null, sessionId: null, error: validation.errors[0].message };
    }

    const { data: rawData, error: rpcError } = await authService.register({
      full_name: normalizeInput(data.full_name),
      email: normalizeEmail(data.email),
      password: data.password || '',
      phone: data.phone ? normalizeInput(data.phone) : undefined,
      role: data.role || 'student'
    });

    if (rpcError) return { user: null, sessionId: null, error: 'Signup service unavailable' };

    const result = rawData as { success: boolean, user: User, session_id: string, error?: string };
    if (!result.success) return { user: null, sessionId: null, error: result.error };

    const user = result.user;
    const sessionId = result.session_id;

    const { UserMapper } = await import('../mappers');
    return {
      user: UserMapper.toDTO(user),
      sessionId: sessionId
    };
  }
}

export const authController = new AuthController();
