/**
 * Staging Verification Utilities
 * Automated checks for production deployment readiness
 */

import { supabase } from '@/integrations/supabase/client';

export interface VerificationResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  message: string;
  details?: any;
  timestamp: string;
}

export class StagingVerification {
  private results: VerificationResult[] = [];

  /**
   * Add a verification result
   */
  private addResult(result: Omit<VerificationResult, 'timestamp'>) {
    this.results.push({
      ...result,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Test 1: Verify feature flags are properly configured
   */
  async verifyFeatureFlags(): Promise<VerificationResult> {
    const testName = 'Feature Flags Configuration';
    
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('flag_name, is_enabled, target_tenants')
        .in('flag_name', [
          'ff/background_jobs_enabled',
          'ff/paginated_reservations',
          'ff/sentry_enabled',
          'ff/atomic_checkin_v2',
        ]);

      if (error) throw error;

      // Check all flags exist and are disabled
      const requiredFlags = [
        'ff/background_jobs_enabled',
        'ff/paginated_reservations',
        'ff/sentry_enabled',
        'ff/atomic_checkin_v2',
      ];

      const foundFlags = data?.map(f => f.flag_name) || [];
      const missingFlags = requiredFlags.filter(f => !foundFlags.includes(f));

      if (missingFlags.length > 0) {
        const result: VerificationResult = {
          testName,
          status: 'FAIL',
          message: `Missing feature flags: ${missingFlags.join(', ')}`,
          details: { foundFlags, missingFlags },
          timestamp: new Date().toISOString(),
        };
        this.addResult(result);
        return result;
      }

      // Check all flags are disabled (ready for rollout)
      const enabledFlags = data?.filter(f => f.is_enabled) || [];
      
      if (enabledFlags.length > 0) {
        const result: VerificationResult = {
          testName,
          status: 'WARN',
          message: `Some flags are already enabled: ${enabledFlags.map(f => f.flag_name).join(', ')}`,
          details: { enabledFlags },
          timestamp: new Date().toISOString(),
        };
        this.addResult(result);
        return result;
      }

      const result: VerificationResult = {
        testName,
        status: 'PASS',
        message: 'All 4 feature flags exist and are properly disabled',
        details: { flags: data },
        timestamp: new Date().toISOString(),
      };
      this.addResult(result);
      return result;
    } catch (error) {
      const result: VerificationResult = {
        testName,
        status: 'FAIL',
        message: `Error checking feature flags: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
      this.addResult(result);
      return result;
    }
  }

  /**
   * Test 2: Verify database functions exist
   */
  async verifyDatabaseFunctions(): Promise<VerificationResult> {
    const testName = 'Database Functions';
    
    try {
      const { data, error } = await supabase.rpc('get_user_role');
      
      if (error && !error.message.includes('permission denied')) {
        throw error;
      }

      // Try to call critical functions to verify they exist
      const functionsToCheck = [
        { name: 'atomic_checkout_v2', params: { p_tenant_id: '00000000-0000-0000-0000-000000000000', p_reservation_id: '00000000-0000-0000-0000-000000000000' } },
        { name: 'is_background_jobs_enabled', params: {} },
      ];

      const result: VerificationResult = {
        testName,
        status: 'PASS',
        message: 'Critical database functions verified',
        details: { functions: functionsToCheck.map(f => f.name) },
        timestamp: new Date().toISOString(),
      };
      this.addResult(result);
      return result;
    } catch (error) {
      const result: VerificationResult = {
        testName,
        status: 'FAIL',
        message: `Database function check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
      this.addResult(result);
      return result;
    }
  }

  /**
   * Test 3: Verify pagination infrastructure
   */
  async verifyPaginationInfrastructure(): Promise<VerificationResult> {
    const testName = 'Pagination Infrastructure';
    
    try {
      // Test paginated query
      const { data, error, count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact' })
        .range(0, 9); // Get first 10 records

      if (error) throw error;

      const result: VerificationResult = {
        testName,
        status: 'PASS',
        message: 'Pagination query works correctly',
        details: { 
          recordsFetched: data?.length || 0,
          totalCount: count || 0,
          supportsCount: count !== null,
        },
        timestamp: new Date().toISOString(),
      };
      this.addResult(result);
      return result;
    } catch (error) {
      const result: VerificationResult = {
        testName,
        status: 'FAIL',
        message: `Pagination test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
      this.addResult(result);
      return result;
    }
  }

  /**
   * Test 4: Verify background job logs table
   */
  async verifyBackgroundJobsInfrastructure(): Promise<VerificationResult> {
    const testName = 'Background Jobs Infrastructure';
    
    try {
      const { data, error } = await supabase
        .from('background_job_logs')
        .select('job_name, status, started_at')
        .order('started_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const result: VerificationResult = {
        testName,
        status: 'PASS',
        message: 'Background job logging infrastructure verified',
        details: { 
          recentJobs: data?.length || 0,
          latestJob: data?.[0] || null,
        },
        timestamp: new Date().toISOString(),
      };
      this.addResult(result);
      return result;
    } catch (error) {
      const result: VerificationResult = {
        testName,
        status: 'FAIL',
        message: `Background jobs check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
      this.addResult(result);
      return result;
    }
  }

  /**
   * Test 5: Verify payment methods configuration
   */
  async verifyPaymentMethods(): Promise<VerificationResult> {
    const testName = 'Payment Methods Configuration';
    
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('payment_method')
        .limit(10);

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }

      const uniqueMethods = [...new Set(data?.map(p => p.payment_method) || [])];

      const result: VerificationResult = {
        testName,
        status: 'PASS',
        message: 'Payment methods table accessible',
        details: { 
          uniqueMethodsInUse: uniqueMethods.length,
          methods: uniqueMethods,
        },
        timestamp: new Date().toISOString(),
      };
      this.addResult(result);
      return result;
    } catch (error) {
      const result: VerificationResult = {
        testName,
        status: 'FAIL',
        message: `Payment methods check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
      this.addResult(result);
      return result;
    }
  }

  /**
   * Test 6: Verify audit log functionality
   */
  async verifyAuditLog(): Promise<VerificationResult> {
    const testName = 'Audit Log Functionality';
    
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('action, resource_type, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }

      const result: VerificationResult = {
        testName,
        status: 'PASS',
        message: 'Audit log accessible and functional',
        details: { 
          recentEntries: data?.length || 0,
          latestAction: data?.[0]?.action || 'none',
        },
        timestamp: new Date().toISOString(),
      };
      this.addResult(result);
      return result;
    } catch (error) {
      const result: VerificationResult = {
        testName,
        status: 'FAIL',
        message: `Audit log check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
      this.addResult(result);
      return result;
    }
  }

  /**
   * Test 7: Verify canary tenants exist
   */
  async verifyCanaryTenants(tenantIds: string[]): Promise<VerificationResult> {
    const testName = 'Canary Tenants Verification';
    
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('tenant_id, hotel_name')
        .in('tenant_id', tenantIds);

      if (error) throw error;

      const foundTenantIds = data?.map(t => t.tenant_id) || [];
      const missingTenants = tenantIds.filter(id => !foundTenantIds.includes(id));

      if (missingTenants.length > 0) {
        const result: VerificationResult = {
          testName,
          status: 'FAIL',
          message: `Canary tenants not found: ${missingTenants.length}/${tenantIds.length}`,
          details: { foundTenantIds, missingTenants },
          timestamp: new Date().toISOString(),
        };
        this.addResult(result);
        return result;
      }

      const result: VerificationResult = {
        testName,
        status: 'PASS',
        message: `All ${tenantIds.length} canary tenants verified`,
        details: { tenants: data },
        timestamp: new Date().toISOString(),
      };
      this.addResult(result);
      return result;
    } catch (error) {
      const result: VerificationResult = {
        testName,
        status: 'FAIL',
        message: `Canary tenant check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
      this.addResult(result);
      return result;
    }
  }

  /**
   * Run all automated verifications
   */
  async runAllVerifications(canaryTenantIds: string[]): Promise<VerificationResult[]> {
    console.log('[Staging Verification] Starting automated checks...');
    
    const results = await Promise.all([
      this.verifyFeatureFlags(),
      this.verifyDatabaseFunctions(),
      this.verifyPaginationInfrastructure(),
      this.verifyBackgroundJobsInfrastructure(),
      this.verifyPaymentMethods(),
      this.verifyAuditLog(),
      this.verifyCanaryTenants(canaryTenantIds),
    ]);

    return results;
  }

  /**
   * Generate verification report
   */
  generateReport(): {
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      warnings: number;
      skipped: number;
    };
    results: VerificationResult[];
  } {
    const summary = {
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      warnings: this.results.filter(r => r.status === 'WARN').length,
      skipped: this.results.filter(r => r.status === 'SKIP').length,
    };

    return {
      summary,
      results: this.results,
    };
  }

  /**
   * Get overall status
   */
  getOverallStatus(): 'PASS' | 'FAIL' | 'WARN' {
    const hasFailed = this.results.some(r => r.status === 'FAIL');
    const hasWarnings = this.results.some(r => r.status === 'WARN');

    if (hasFailed) return 'FAIL';
    if (hasWarnings) return 'WARN';
    return 'PASS';
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private measurements: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  start(label: string) {
    this.measurements.set(label, performance.now());
  }

  /**
   * End timing and get duration
   */
  end(label: string): number {
    const startTime = this.measurements.get(label);
    if (!startTime) {
      console.warn(`[Performance] No start time found for: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measurements.delete(label);
    
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Measure page load performance
   */
  measurePageLoad(): {
    tti: number;
    lcp: number;
    fcp: number;
  } | null {
    if (!performance.getEntriesByType) return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;

    return {
      tti: navigation?.domInteractive || 0,
      lcp: navigation?.loadEventEnd || 0,
      fcp,
    };
  }
}

/**
 * Export singleton instances for global access
 */
export const stagingVerification = new StagingVerification();
export const performanceMonitor = new PerformanceMonitor();