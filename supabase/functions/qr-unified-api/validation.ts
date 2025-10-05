// Input validation schemas using simple validation (no external deps)

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export function validateQRValidation(data: any): ValidationResult {
  const errors: string[] = [];
  
  if (!data.qrToken || typeof data.qrToken !== 'string') {
    errors.push('qrToken is required and must be a string');
  } else if (data.qrToken.length < 10 || data.qrToken.length > 500) {
    errors.push('qrToken must be between 10 and 500 characters');
  }
  
  if (data.deviceInfo && typeof data.deviceInfo !== 'object') {
    errors.push('deviceInfo must be an object');
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateRequestCreation(data: any): ValidationResult {
  const errors: string[] = [];
  
  if (!data.sessionId || typeof data.sessionId !== 'string') {
    errors.push('sessionId is required and must be a string');
  }
  
  if (!data.requestType || typeof data.requestType !== 'string') {
    errors.push('requestType is required and must be a string');
  } else if (data.requestType.length > 100) {
    errors.push('requestType must be less than 100 characters');
  }
  
  if (!data.requestData || typeof data.requestData !== 'object') {
    errors.push('requestData is required and must be an object');
  }
  
  if (data.priority) {
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(data.priority)) {
      errors.push('priority must be one of: low, normal, high, urgent');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export function sanitizeDeviceInfo(deviceInfo: any): Record<string, any> {
  if (!deviceInfo || typeof deviceInfo !== 'object') {
    return {};
  }
  
  // Only allow specific safe fields
  const allowedFields = ['userAgent', 'language', 'platform', 'screenWidth', 'screenHeight'];
  const sanitized: Record<string, any> = {};
  
  for (const field of allowedFields) {
    if (deviceInfo[field]) {
      // Convert to string and limit length
      sanitized[field] = String(deviceInfo[field]).substring(0, 500);
    }
  }
  
  return sanitized;
}

export function sanitizeRequestData(requestData: any): Record<string, any> {
  if (!requestData || typeof requestData !== 'object') {
    return {};
  }
  
  // Recursively sanitize strings to prevent injection
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(requestData)) {
    if (typeof value === 'string') {
      // Limit string length and remove potentially dangerous characters
      sanitized[key] = value.substring(0, 5000).replace(/[<>]/g, '');
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v => 
        typeof v === 'string' ? v.substring(0, 1000).replace(/[<>]/g, '') : v
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestData(value);
    }
  }
  
  return sanitized;
}
