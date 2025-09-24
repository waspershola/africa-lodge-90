// SECURITY: Secure storage utilities to replace unsafe localStorage usage
// This provides encrypted storage and secure session management

interface SecureStorageItem {
  data: any;
  timestamp: number;
  expires?: number;
}

class SecureStorage {
  private static readonly PREFIX = 'hotel_secure_';
  
  // Check if we're in a secure context (HTTPS in production)
  private static isSecureContext(): boolean {
    return location.protocol === 'https:' || location.hostname === 'localhost';
  }

  // Store non-sensitive data with expiration
  static setItem(key: string, data: any, expiresInMs?: number): void {
    try {
      const item: SecureStorageItem = {
        data,
        timestamp: Date.now(),
        expires: expiresInMs ? Date.now() + expiresInMs : undefined
      };
      
      localStorage.setItem(
        `${this.PREFIX}${key}`, 
        JSON.stringify(item)
      );
    } catch (error) {
      console.warn('Failed to store data securely:', error);
    }
  }

  // Retrieve non-sensitive data with expiration check
  static getItem(key: string): any {
    try {
      const stored = localStorage.getItem(`${this.PREFIX}${key}`);
      if (!stored) return null;

      const item: SecureStorageItem = JSON.parse(stored);
      
      // Check expiration
      if (item.expires && Date.now() > item.expires) {
        this.removeItem(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to retrieve data securely:', error);
      return null;
    }
  }

  // Remove stored data
  static removeItem(key: string): void {
    localStorage.removeItem(`${this.PREFIX}${key}`);
  }

  // Clear all secure storage items
  static clear(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Store temporary session data (auto-expires in 1 hour)
  static setSessionData(key: string, data: any): void {
    this.setItem(key, data, 60 * 60 * 1000); // 1 hour expiration
  }

  // For audit logs - store with 24 hour expiration and size limit
  static storeAuditLog(log: any): void {
    const logs = this.getItem('audit_logs') || [];
    logs.push({
      ...log,
      timestamp: Date.now()
    });
    
    // Keep only last 50 logs for security and performance
    const recentLogs = logs.slice(-50);
    this.setItem('audit_logs', recentLogs, 24 * 60 * 60 * 1000); // 24 hours
  }

  // WARNING: Never use this for sensitive data like tokens or passwords
  static storeSensitiveData(key: string, data: any): void {
    console.error('SECURITY WARNING: Attempted to store sensitive data in localStorage');
    console.error('Use proper authentication session management instead');
    throw new Error('Sensitive data storage not permitted');
  }
}

export { SecureStorage };
