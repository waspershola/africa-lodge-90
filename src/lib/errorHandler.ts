import { AuthError, AuthErrorCode, ValidationError } from '@/types/auth-errors';
import { toast } from '@/hooks/use-toast';

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  USER_NOT_FOUND: 'No account found for this email. Contact your hotel administrator.',
  ACCOUNT_INACTIVE: 'Your account is not active. Please contact support.',
  ACCOUNT_SUSPENDED: 'Your account has been suspended. Please contact support.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists. Try logging in instead.',
  INVALID_TOKEN: 'The provided token is invalid or has been tampered with.',
  TOKEN_EXPIRED: 'This link has expired. Please request a new one.',
  WEAK_PASSWORD: 'Password must be at least 8 characters with numbers and symbols.',
  PASSWORD_MISMATCH: 'Passwords do not match. Please try again.',
  MISSING_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  RATE_LIMITED: 'Too many attempts. Please wait before trying again.',
  INVITE_EXPIRED: 'Your invitation link has expired. Request a new one.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  NETWORK_ERROR: 'Network connection failed. Please check your connection.',
};

export const AUTH_ERROR_ICONS: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: '⚠️',
  USER_NOT_FOUND: '👤',
  ACCOUNT_INACTIVE: '🔒',
  ACCOUNT_SUSPENDED: '🚫',
  EMAIL_ALREADY_EXISTS: '📧',
  INVALID_TOKEN: '🔐',
  TOKEN_EXPIRED: '⏰',
  WEAK_PASSWORD: '🔒',
  PASSWORD_MISMATCH: '🔑',
  MISSING_FIELD: '❗',
  INVALID_EMAIL: '📧',
  RATE_LIMITED: '⏱️',
  INVITE_EXPIRED: '⏰',
  SERVER_ERROR: '🔧',
  NETWORK_ERROR: '🌐',
};

export class AuthErrorHandler {
  static createError(code: AuthErrorCode, field?: string, details?: string): AuthError {
    return {
      code,
      message: AUTH_ERROR_MESSAGES[code],
      field,
      details,
      supportContact: ['ACCOUNT_INACTIVE', 'ACCOUNT_SUSPENDED', 'SERVER_ERROR'].includes(code),
    };
  }

  static parseSupabaseError(error: any): AuthError {
    console.error('Supabase error:', error);

    // Handle specific Supabase error messages
    if (error?.message?.includes('Invalid login credentials')) {
      return this.createError('INVALID_CREDENTIALS');
    }
    
    if (error?.message?.includes('User already registered')) {
      return this.createError('EMAIL_ALREADY_EXISTS');
    }
    
    if (error?.message?.includes('Password should be at least 6 characters')) {
      return this.createError('WEAK_PASSWORD', 'password');
    }
    
    if (error?.message?.includes('rate limit')) {
      return this.createError('RATE_LIMITED');
    }
    
    if (error?.message?.includes('network')) {
      return this.createError('NETWORK_ERROR');
    }

    // Default to server error for unknown errors
    return this.createError('SERVER_ERROR', undefined, error?.message);
  }

  static showErrorToast(error: AuthError) {
    const icon = AUTH_ERROR_ICONS[error.code];
    toast({
      variant: 'destructive',
      title: `${icon} Authentication Failed`,
      description: error.message,
    });
  }

  static showSuccessToast(message: string, title = '✅ Success') {
    toast({
      variant: 'default',
      title,
      description: message,
    });
  }

  static validateEmail(email: string): ValidationError | null {
    if (!email) {
      return { field: 'email', message: 'Email is required', code: 'MISSING_FIELD' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { field: 'email', message: 'Please enter a valid email address', code: 'INVALID_EMAIL' };
    }
    
    return null;
  }

  static validatePassword(password: string, isRequired = true): ValidationError | null {
    if (!password && isRequired) {
      return { field: 'password', message: 'Password is required', code: 'MISSING_FIELD' };
    }
    
    if (password && password.length < 8) {
      return { field: 'password', message: 'Password must be at least 8 characters', code: 'WEAK_PASSWORD' };
    }
    
    if (password && !/(?=.*[0-9])/.test(password)) {
      return { field: 'password', message: 'Password must contain at least one number', code: 'WEAK_PASSWORD' };
    }
    
    if (password && !/(?=.*[!@#$%^&*])/.test(password)) {
      return { field: 'password', message: 'Password must contain at least one symbol', code: 'WEAK_PASSWORD' };
    }
    
    return null;
  }

  static validatePasswordConfirmation(password: string, confirmPassword: string): ValidationError | null {
    if (!confirmPassword) {
      return { field: 'confirmPassword', message: 'Please confirm your password', code: 'MISSING_FIELD' };
    }
    
    if (password !== confirmPassword) {
      return { field: 'confirmPassword', message: 'Passwords do not match', code: 'PASSWORD_MISMATCH' };
    }
    
    return null;
  }

  static getPasswordStrength(password: string): {
    score: number;
    label: string;
    color: string;
  } {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*[0-9])/.test(password)) score++;
    if (/(?=.*[!@#$%^&*])/.test(password)) score++;
    
    if (score <= 2) return { score, label: 'Weak', color: 'hsl(var(--destructive))' };
    if (score <= 4) return { score, label: 'Fair', color: 'hsl(var(--warning))' };
    if (score <= 5) return { score, label: 'Good', color: 'hsl(var(--success))' };
    return { score, label: 'Strong', color: 'hsl(var(--primary))' };
  }
}

export default AuthErrorHandler;