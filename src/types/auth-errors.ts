export type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'ACCOUNT_INACTIVE'
  | 'ACCOUNT_SUSPENDED'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'WEAK_PASSWORD'
  | 'PASSWORD_MISMATCH'
  | 'MISSING_FIELD'
  | 'INVALID_EMAIL'
  | 'RATE_LIMITED'
  | 'INVITE_EXPIRED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  field?: string;
  details?: string;
  retryAfter?: number; // For rate limiting
  supportContact?: boolean;
}

export interface AuthErrorResponse {
  success: false;
  error: AuthError;
}

export interface AuthSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type AuthResponse<T = any> = AuthErrorResponse | AuthSuccessResponse<T>;

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FormErrors {
  [field: string]: string;
}