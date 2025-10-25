// @ts-nocheck
// Additional authentication hooks for testing and validation
import { useState } from 'react';
import { supabaseApi } from '@/lib/supabase-api';
import { createTestUser, testTenantIsolation } from '@/lib/auth-utils';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';

export function useSupabaseAuth() {
  const [isCreatingTestUser, setIsCreatingTestUser] = useState(false);
  const [isTestingIsolation, setIsTestingIsolation] = useState(false);
  const { toast } = useToast();
  const auditLog = useAuditLog();

  const createTestUsers = async () => {
    setIsCreatingTestUser(true);
    try {
      // Get test tenants
      const tenants = await supabaseApi.tenants.getTenants();
      if (tenants.length < 2) {
        throw new Error('Need at least 2 tenants for testing');
      }

      const tenant1 = tenants[0];
      const tenant2 = tenants[1];

      // Create test users for different roles and tenants
      const testUsers = [
        {
          email: 'owner1@test.com',
          password: 'TestPassword123!',
          role: 'OWNER',
          tenantId: tenant1.tenant_id
        },
        {
          email: 'manager1@test.com', 
          password: 'TestPassword123!',
          role: 'MANAGER',
          tenantId: tenant1.tenant_id
        },
        {
          email: 'frontdesk1@test.com',
          password: 'TestPassword123!',
          role: 'FRONT_DESK',
          tenantId: tenant1.tenant_id
        },
        {
          email: 'owner2@test.com',
          password: 'TestPassword123!',
          role: 'OWNER',
          tenantId: tenant2.tenant_id
        },
        {
          email: 'superadmin@test.com',
          password: 'TestPassword123!',
          role: 'SUPER_ADMIN',
          tenantId: null
        }
      ];

      for (const user of testUsers) {
        try {
          await createTestUser(user.email, user.password, user.role, user.tenantId);
          await auditLog.logEvent({
            action: 'TEST_USER_CREATED',
            resource_type: 'AUTH_TESTING',
            description: `Created test user: ${user.email} with role: ${user.role}`,
            metadata: {
              test_user_email: user.email,
              test_user_role: user.role,
              tenant_id: user.tenantId
            }
          });
        } catch (error: any) {
          console.warn(`Failed to create test user ${user.email}:`, error.message);
        }
      }

      toast({
        title: 'Test Users Created',
        description: 'Authentication test users have been created successfully.',
      });

      return testUsers;
    } catch (error: any) {
      console.error('Error creating test users:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create test users',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsCreatingTestUser(false);
    }
  };

  const validateTenantIsolation = async () => {
    setIsTestingIsolation(true);
    try {
      const tenants = await supabaseApi.tenants.getTenants();
      if (tenants.length < 2) {
        throw new Error('Need at least 2 tenants for isolation testing');
      }

      const tenant1 = tenants[0];
      const tenant2 = tenants[1];

      // Test tenant isolation
      const isolationWorking = await testTenantIsolation(
        tenant1.tenant_id,
        tenant2.tenant_id
      );

      await auditLog.logEvent({
        action: 'TENANT_ISOLATION_TEST',
        resource_type: 'SECURITY_VALIDATION',
        description: `Tenant isolation test: ${isolationWorking ? 'PASSED' : 'FAILED'}`,
        metadata: {
          test_result: isolationWorking,
          tenant_1: tenant1.tenant_id,
          tenant_2: tenant2.tenant_id,
          test_timestamp: new Date().toISOString()
        }
      });

      if (isolationWorking) {
        toast({
          title: 'Security Validation Passed',
          description: 'Tenant isolation is working correctly.',
        });
      } else {
        toast({
          title: 'Security Breach Detected!',
          description: 'Tenant isolation is broken - users can access other tenant data!',
          variant: 'destructive',
        });
      }

      return isolationWorking;
    } catch (error: any) {
      console.error('Error testing tenant isolation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to test tenant isolation',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsTestingIsolation(false);
    }
  };

  const validateJWTClaims = async () => {
    try {
      const result = await supabaseApi.auth.signIn(
        'owner1@test.com',
        'TestPassword123!'
      );
      const session = result?.session;

      if (!session) {
        throw new Error('No session found');
      }

      // Extract and validate JWT claims
      const payload = session.access_token.split('.')[1];
      const decodedPayload = atob(payload);
      const claims = JSON.parse(decodedPayload);

      const hasRequiredClaims = !!(claims.role && claims.tenant_id);

      await auditLog.logEvent({
        action: 'JWT_CLAIMS_VALIDATION',
        resource_type: 'SECURITY_VALIDATION',
        description: `JWT claims validation: ${hasRequiredClaims ? 'PASSED' : 'FAILED'}`,
        metadata: {
          has_role_claim: !!claims.role,
          has_tenant_claim: !!claims.tenant_id,
          claims_found: Object.keys(claims),
          validation_result: hasRequiredClaims
        }
      });

      if (hasRequiredClaims) {
        toast({
          title: 'JWT Validation Passed',
          description: 'JWT tokens contain required security claims.',
        });
      } else {
        toast({
          title: 'JWT Validation Failed',
          description: 'JWT tokens missing required role or tenant claims!',
          variant: 'destructive',
        });
      }

      // Clean up test session
      await supabaseApi.auth.signOut();

      return hasRequiredClaims;
    } catch (error: any) {
      console.error('Error validating JWT claims:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to validate JWT claims',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    createTestUsers,
    validateTenantIsolation,
    validateJWTClaims,
    isCreatingTestUser,
    isTestingIsolation
  };
}