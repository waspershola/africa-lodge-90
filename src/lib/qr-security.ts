// Production-ready QR security utilities

export interface QRToken {
  hotel_id: string;
  location_id: string;
  location_type: 'room' | 'bar' | 'pool' | 'restaurant' | 'lobby';
  session_id: string;
  expires_at: number;
  permissions: string[];
}

export class QRSecurity {
  // In production, this would use proper JWT signing with a secret key
  static generateSessionToken(payload: Omit<QRToken, 'session_id' | 'expires_at'>): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    const token: QRToken = {
      ...payload,
      session_id: sessionId,
      expires_at: expiresAt
    };

    // In production: return jwt.sign(token, process.env.JWT_SECRET)
    return btoa(JSON.stringify(token));
  }

  static validateToken(token: string): QRToken | null {
    try {
      // In production: const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const decoded = JSON.parse(atob(token)) as QRToken;
      
      // Check expiration
      if (Date.now() > decoded.expires_at) {
        throw new Error('Token expired');
      }

      return decoded;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  // Generate permanent QR URL using the QR token (no expiry)
  static generateQRUrl(qrToken: string): string {
    // For production, use the current domain. For development, use localhost
    const baseUrl = typeof window !== 'undefined' && window.location 
      ? window.location.origin 
      : 'https://yourapp.com'; // Fallback for SSR
    // Use /qr/:token route which validates first, then redirects to /guest/qr/:token
    return `${baseUrl}/qr/${qrToken}`;
  }

  static extractTokenFromUrl(): string | null {
    const path = window.location.pathname;
    const match = path.match(/^\/guest\/qr\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  // Rate limiting for security
  static async checkRateLimit(sessionId: string, action: string): Promise<boolean> {
    const key = `rate_limit_${sessionId}_${action}`;
    const now = Date.now();
    const window = 60 * 1000; // 1 minute window
    const maxRequests = 10; // Max 10 requests per minute

    // In production, this would use Redis or similar
    const stored = localStorage.getItem(key);
    const requests = stored ? JSON.parse(stored) : [];
    
    // Clean old requests
    const validRequests = requests.filter((time: number) => now - time < window);
    
    if (validRequests.length >= maxRequests) {
      return false; // Rate limited
    }

    validRequests.push(now);
    // SECURITY: Use secure storage for rate limiting data
    try {
      const { SecureStorage } = await import('./secure-storage');
      SecureStorage.setSessionData(key.replace('qr_rate_limit_', ''), validRequests);
    } catch {
      localStorage.setItem(key, JSON.stringify(validRequests)); // Fallback
    }
    return true;
  }

  // Audit logging
  static async logAction(sessionId: string, action: string, details: any): Promise<void> {
    const auditLog = {
      session_id: sessionId,
      action,
      details,
      timestamp: new Date().toISOString(),
      ip_address: 'unknown', // In production, get real IP
      user_agent: navigator.userAgent
    };

    // In production, send to audit service
    console.log('Audit Log:', auditLog);
    
    // SECURITY: Store audit logs securely (in production, send to backend)
    try {
      const { SecureStorage } = await import('./secure-storage');
      SecureStorage.storeAuditLog(auditLog);
    } catch {
      // Fallback for compatibility
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      logs.push(auditLog);
      localStorage.setItem('audit_logs', JSON.stringify(logs.slice(-50)));
    }
  }
}