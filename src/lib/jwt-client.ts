// Client-side JWT utilities

interface JWTPayload {
  session_id: string;
  tenant_id: string;
  qr_code_id: string;
  exp: number;
  iat: number;
}

export class JWTClient {
  private static TOKEN_KEY = 'qr_session_jwt';
  private static SESSION_KEY = 'qr_session_data';

  static storeToken(token: string, sessionData: any): void {
    try {
      sessionStorage.setItem(this.TOKEN_KEY, token);
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to store JWT token:', error);
    }
  }

  static getToken(): string | null {
    try {
      return sessionStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get JWT token:', error);
      return null;
    }
  }

  static getSessionData(): any | null {
    try {
      const data = sessionStorage.getItem(this.SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get session data:', error);
      return null;
    }
  }

  static clearToken(): void {
    try {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear JWT token:', error);
    }
  }

  static isTokenValid(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload) return false;
      
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  static decodeToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      const decoded = JSON.parse(atob(payload));
      return decoded as JWTPayload;
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }

  static getTokenExpiry(token: string): Date | null {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return null;
    return new Date(payload.exp * 1000);
  }
}
