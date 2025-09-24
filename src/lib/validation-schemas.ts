// SECURITY: Comprehensive Input validation schemas using Zod
// Prevents injection attacks, XSS, and ensures data integrity

import { z } from 'zod';

// Enhanced sanitization helpers (must be defined before use)
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>'"&]/g, '') // Remove HTML and dangerous characters
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: URLs
    .trim()
    .slice(0, 1000); // Limit length
};

export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Enhanced guest registration validation with stronger security
export const GuestRegistrationSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name too long')
    .regex(/^[a-zA-Z\s'\-\.]+$/, 'Invalid characters in name')
    .transform(sanitizeInput),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long')
    .regex(/^[a-zA-Z\s'\-\.]+$/, 'Invalid characters in name')
    .transform(sanitizeInput),
  
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email too long')
    .toLowerCase()
    .transform(sanitizeInput),
  
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number too short')
    .max(20, 'Phone number too long')
    .transform(sanitizeInput),
  
  guestIdNumber: z.string()
    .min(3, 'ID number too short')
    .max(30, 'ID number too long')
    .regex(/^[a-zA-Z0-9\-]+$/, 'Invalid ID format')
    .transform(sanitizeInput)
    .optional(),
  
  nationality: z.string()
    .min(2, 'Nationality required')
    .max(50, 'Nationality too long')
    .regex(/^[a-zA-Z\s]+$/, 'Invalid nationality format')
    .transform(sanitizeInput)
    .optional(),
  
  address: z.string()
    .max(200, 'Address too long')
    .transform(sanitizeInput)
    .optional()
});

// QR Token validation for security
export const QRTokenSchema = z.string()
  .min(10, 'Invalid QR token')
  .max(500, 'QR token too long')
  .regex(/^[a-zA-Z0-9\-_.=]+$/, 'QR token contains invalid characters');

// QR service request validation
export const QRServiceRequestSchema = z.object({
  serviceType: z.enum(['housekeeping', 'maintenance', 'room_service', 'concierge', 'wifi_support']),
  
  message: z.string()
    .min(1, 'Message is required')
    .max(500, 'Message too long')
    .regex(/^[a-zA-Z0-9\s\.\,\!\?\-_@#$%&*()+=[\]{}|;:'",.<>/?]+$/, 'Invalid characters in message'),
  
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  
  roomNumber: z.string()
    .regex(/^[A-Z0-9\-]+$/i, 'Invalid room number format')
    .max(10, 'Room number too long')
    .optional(),
  
  contactInfo: z.string()
    .max(100, 'Contact info too long')
    .optional()
});

// POS order validation
export const POSOrderSchema = z.object({
  items: z.array(z.object({
    menuItemId: z.string().uuid('Invalid menu item ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Quantity too large'),
    specialRequests: z.string().max(200, 'Special requests too long').optional()
  })).min(1, 'At least one item required'),
  
  orderType: z.enum(['dine_in', 'room_service', 'takeout']),
  
  specialInstructions: z.string()
    .max(300, 'Instructions too long')
    .optional(),
  
  roomId: z.string().uuid('Invalid room ID').optional()
});

// User profile validation
export const UserProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in name'),
  
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email too long'),
  
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format')
    .optional(),
  
  role: z.enum(['OWNER', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'POS', 'STAFF'])
});

// Password validation
export const PasswordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain uppercase, lowercase, number, and special character');

// Hotel settings validation
export const HotelSettingsSchema = z.object({
  hotelName: z.string()
    .min(1, 'Hotel name is required')
    .max(100, 'Hotel name too long')
    .regex(/^[a-zA-Z0-9\s&'\-\.]+$/, 'Invalid characters in hotel name'),
  
  checkInTime: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  
  checkOutTime: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  
  taxRate: z.number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%'),
  
  currency: z.enum(['NGN', 'USD', 'EUR', 'GBP']),
  
  contactPhone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format')
    .optional()
});


export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
    .slice(0, 100);
};

// Validation middleware helper
export const validateAndSanitize = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new Error(`Validation failed: ${issues}`);
    }
    throw error;
  }
};