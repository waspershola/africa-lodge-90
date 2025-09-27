import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { toast } from 'sonner';

interface SecurityValidation {
  isValid: boolean;
  violations: string[];
  userDbRecord: any;
  sessionValid: boolean;
}

export function useSecurityValidation() {
  const [validation, setValidation] = useState<SecurityValidation>({
    isValid: true,
    violations: [],
    userDbRecord: null,
    sessionValid: true
  });
  const { user, session, logout } = useAuth();

  useEffect(() => {
    if (!user || !session) return;

    const validateSecurity = async () => {
      const violations: string[] = [];
      let userDbRecord = null;
      let sessionValid = true;

      try {
        console.log('[SECURITY VALIDATION] Starting security validation for user:', user.email);

        // 1. Verify user exists in database and role matches
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('id, email, role, tenant_id, is_active, last_login')
          .eq('id', user.id)
          .single();

        if (dbError || !dbUser) {
          violations.push('USER_NOT_FOUND_IN_DB');
          console.error('[SECURITY VIOLATION] User not found in database:', dbError);
        } else {
          userDbRecord = dbUser;
          
          // Check if roles match
          if (dbUser.role !== user.role) {
            violations.push('ROLE_MISMATCH');
            console.error('[SECURITY VIOLATION] Role mismatch - Session:', user.role, 'DB:', dbUser.role);
          }

          // Check if user is active
          if (!dbUser.is_active) {
            violations.push('INACTIVE_USER');
            console.error('[SECURITY VIOLATION] Inactive user attempting access');
          }

          // Check tenant_id consistency
          if (dbUser.tenant_id !== user.tenant_id) {
            violations.push('TENANT_MISMATCH');
            console.error('[SECURITY VIOLATION] Tenant mismatch - Session:', user.tenant_id, 'DB:', dbUser.tenant_id);
          }
        }

        // 2. Validate session expiration
        if (session.expires_at) {
          const expiresAt = new Date(session.expires_at * 1000);
          const now = new Date();
          if (now >= expiresAt) {
            violations.push('SESSION_EXPIRED');
            sessionValid = false;
            console.error('[SECURITY VIOLATION] Session expired');
          }
        }

        // 3. Check for suspicious access patterns
        const currentPath = window.location.pathname;
        if (user.role === 'OWNER' && currentPath.startsWith('/sa/')) {
          violations.push('UNAUTHORIZED_ROUTE_ACCESS');
          console.error('[SECURITY VIOLATION] OWNER attempting to access SUPER_ADMIN route:', currentPath);
          
          // Log this security violation
          await supabase.from('audit_log').insert({
            action: 'SECURITY_VIOLATION',
            resource_type: 'ROUTE_ACCESS',
            description: `OWNER ${user.email} attempted unauthorized access to ${currentPath}`,
            actor_id: user.id,
            actor_email: user.email,
            actor_role: user.role,
            tenant_id: user.tenant_id,
            metadata: {
              violation_type: 'UNAUTHORIZED_ROUTE_ACCESS',
              attempted_route: currentPath,
              user_agent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }
          });
        }

        // 4. Validate against known attack patterns
        const suspiciousPatterns = [
          /\/sa\/.*admin/i,
          /\/api\/.*admin/i,
          /\/super.*admin/i
        ];

        if (user.role !== 'SUPER_ADMIN') {
          for (const pattern of suspiciousPatterns) {
            if (pattern.test(currentPath)) {
              violations.push('SUSPICIOUS_PATTERN_DETECTED');
              console.error('[SECURITY VIOLATION] Suspicious access pattern detected:', currentPath);
              break;
            }
          }
        }

        const isValid = violations.length === 0;
        
        setValidation({
          isValid,
          violations,
          userDbRecord,
          sessionValid
        });

        // If there are critical violations, take immediate action
        if (violations.includes('UNAUTHORIZED_ROUTE_ACCESS') || 
            violations.includes('ROLE_MISMATCH') || 
            violations.includes('SESSION_EXPIRED')) {
          
          console.error('[SECURITY] Critical security violations detected, forcing logout');
          toast.error('Security violation detected. You will be logged out for security reasons.');
          
          setTimeout(() => {
            logout();
          }, 2000);
        }

        console.log('[SECURITY VALIDATION] Validation complete:', {
          isValid,
          violations,
          user: { id: user.id, email: user.email, role: user.role },
          currentPath
        });

      } catch (error) {
        console.error('[SECURITY VALIDATION] Error during validation:', error);
        violations.push('VALIDATION_ERROR');
        setValidation({
          isValid: false,
          violations,
          userDbRecord: null,
          sessionValid: false
        });
      }
    };

    // Run validation immediately and then every 30 seconds
    validateSecurity();
    const interval = setInterval(validateSecurity, 30000);

    return () => clearInterval(interval);
  }, [user, session, logout]);

  return validation;
}