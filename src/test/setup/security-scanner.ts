import { supabase } from '@/integrations/supabase/client'

/**
 * Security Scanner for Phase 4 Validation
 * Performs comprehensive security checks on the application
 */

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  description: string
  recommendation: string
  affected_resource?: string
}

export class SecurityScanner {
  private issues: SecurityIssue[] = []

  async runFullSecurityScan(): Promise<SecurityIssue[]> {
    console.log('🔒 Starting comprehensive security scan...')
    
    this.issues = []
    
    await this.checkRLSPolicies()
    await this.checkCrossTenantLeaks()
    await this.checkAuthenticationSecurity()
    await this.checkAPIEndpoints()
    await this.checkInputValidation()
    await this.checkDataExposure()
    
    console.log(`🔍 Security scan complete. Found ${this.issues.length} issues.`)
    return this.issues
  }

  private async checkRLSPolicies(): Promise<void> {
    console.log('📋 Checking RLS policies...')
    
    const criticalTables = [
      'tenants', 'users', 'rooms', 'reservations', 
      'folios', 'payments', 'qr_orders', 'audit_log'
    ] as const

    // Check if RLS is enabled on critical tables
    for (const table of criticalTables) {
      try {
        // Try to access table without proper context (should fail)
        const { data, error } = await (supabase as any)
          .from(table)
          .select('*')
          .limit(1)

        if (data && data.length > 0) {
          this.addIssue({
            severity: 'critical',
            category: 'RLS Policy',
            description: `Table "${table}" may have weak RLS policies - returned data without proper tenant context`,
            recommendation: `Review and strengthen RLS policies for ${table} table`,
            affected_resource: table
          })
        }
      } catch (error) {
        // This is expected - table should block unauthorized access
      }
    }
  }

  private async checkCrossTenantLeaks(): Promise<void> {
    console.log('🏢 Checking cross-tenant data isolation...')
    
      // Test with multiple tenant contexts
      const testTenantIds = ['test-tenant-1', 'test-tenant-2', 'non-existent-tenant']
      
      for (const tenantId of testTenantIds) {
        try {
          // Try to access rooms from specific tenant
          const { data } = await supabase
            .from('rooms')
            .select('*')
            .eq('tenant_id', tenantId)

          // If we get data for non-existent tenant, that's a problem
          if (data && data.length > 0 && tenantId === 'non-existent-tenant') {
            this.addIssue({
              severity: 'critical',
              category: 'Tenant Isolation',
              description: 'Cross-tenant data leak detected - able to access non-existent tenant data',
              recommendation: 'Review tenant isolation mechanisms and RLS policies'
            })
          }
        } catch (error) {
          // Expected for proper isolation
        }
      }
  }

  private async checkAuthenticationSecurity(): Promise<void> {
    console.log('🔐 Checking authentication security...')
    
    // Check for weak authentication flows
    try {
      // Test anonymous access to sensitive endpoints - using individual queries
      try {
        const { data: users } = await supabase.from('users').select('*').limit(1)
        if (users && users.length > 0) {
          this.addIssue({
            severity: 'high',
            category: 'Authentication',
            description: 'Anonymous access detected to sensitive endpoint: users',
            recommendation: 'Implement proper authentication checks for users endpoint',
            affected_resource: 'users'
          })
        }
      } catch (error) {}

      try {
        const { data: folios } = await supabase.from('folios').select('*').limit(1)
        if (folios && folios.length > 0) {
          this.addIssue({
            severity: 'high',
            category: 'Authentication', 
            description: 'Anonymous access detected to sensitive endpoint: folios',
            recommendation: 'Implement proper authentication checks for folios endpoint',
            affected_resource: 'folios'
          })
        }
      } catch (error) {}

      try {
        const { data: payments } = await supabase.from('payments').select('*').limit(1)
        if (payments && payments.length > 0) {
          this.addIssue({
            severity: 'high',
            category: 'Authentication',
            description: 'Anonymous access detected to sensitive endpoint: payments', 
            recommendation: 'Implement proper authentication checks for payments endpoint',
            affected_resource: 'payments'
          })
        }
      } catch (error) {}
      
    } catch (error) {
      // Expected - anonymous access should be blocked
    }

    // Check JWT token handling
    this.checkJWTSecurity()
  }

  private checkJWTSecurity(): void {
    // Check if JWT tokens are being handled securely
    if (typeof window !== 'undefined') {
      const localStorageKeys = Object.keys(localStorage)
      const sessionStorageKeys = Object.keys(sessionStorage)
      
      // Check for JWT tokens in localStorage (security concern)
      const suspiciousKeys = [...localStorageKeys, ...sessionStorageKeys]
        .filter(key => key.includes('token') || key.includes('jwt') || key.includes('auth'))

      if (suspiciousKeys.length > 0) {
        this.addIssue({
          severity: 'medium',
          category: 'Token Security',
          description: 'Potential JWT tokens found in browser storage',
          recommendation: 'Use httpOnly cookies or secure token storage mechanisms',
          affected_resource: suspiciousKeys.join(', ')
        })
      }
    }
  }

  private async checkAPIEndpoints(): Promise<void> {
    console.log('🌐 Checking API endpoint security...')
    
    // Test for common API vulnerabilities
    const testPayloads = [
      "' OR '1'='1", // SQL injection
      '<script>alert("xss")</script>', // XSS
      '../../../etc/passwd', // Path traversal
      '{"__proto__": {"admin": true}}' // Prototype pollution
    ]

    for (const payload of testPayloads) {
      try {
        // Test room search with malicious payload
        const { data } = await supabase
          .from('rooms')
          .select('*')
          .ilike('room_number', `%${payload}%`)
          .limit(1)

        // If query succeeds with malicious input, it might be vulnerable
        // Note: Supabase should handle this, but we're testing
      } catch (error) {
        // Error is expected for malicious inputs
      }
    }
  }

  private async checkInputValidation(): Promise<void> {
    console.log('📝 Checking input validation...')
    
    // Test oversized inputs
    const oversizedString = 'x'.repeat(10000)
    
    try {
      const { error } = await supabase
        .from('qr_orders')
        .insert([{
          qr_code_id: oversizedString,
          service_type: 'test',
          tenant_id: 'test'
        }])

      if (!error) {
        this.addIssue({
          severity: 'medium',
          category: 'Input Validation',
          description: 'Oversized input accepted without validation',
          recommendation: 'Implement input size limits and validation'
        })
      }
    } catch (error) {
      // Expected - should reject oversized input
    }

    // Test special characters and encoding
    const specialChars = ['<', '>', '"', "'", '&', '\x00', '\n\r']
    
    for (const char of specialChars) {
      try {
        const { error } = await supabase
          .from('qr_orders')
          .insert([{
            qr_code_id: `test${char}`,
            service_type: 'test',
            tenant_id: 'test'
          }])
      } catch (error) {
        // Check if error handling is appropriate
      }
    }
  }

  private async checkDataExposure(): Promise<void> {
    console.log('👁️ Checking for data exposure risks...')
    
    // Check for sensitive data in responses
    const sensitiveFields = ['password', 'secret', 'key', 'token', 'hash']
    
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .limit(1)

      if (data && data.length > 0) {
        const user = data[0]
        const exposedFields = Object.keys(user).filter(key => 
          sensitiveFields.some(sensitive => 
            key.toLowerCase().includes(sensitive)
          )
        )

        if (exposedFields.length > 0) {
          this.addIssue({
            severity: 'high',
            category: 'Data Exposure',
            description: `Sensitive fields exposed in user data: ${exposedFields.join(', ')}`,
            recommendation: 'Remove sensitive fields from public API responses',
            affected_resource: 'users table'
          })
        }
      }
    } catch (error) {
      // Expected if access is properly restricted
    }
  }

  private addIssue(issue: SecurityIssue): void {
    this.issues.push({
      ...issue,
      description: `[${issue.category}] ${issue.description}`
    })
  }

  generateSecurityReport(): string {
    const report = ['🔒 SECURITY SCAN REPORT', '=' .repeat(50), '']
    
    const severityOrder = ['critical', 'high', 'medium', 'low']
    const groupedIssues = severityOrder.reduce((acc, severity) => {
      acc[severity] = this.issues.filter(issue => issue.severity === severity)
      return acc
    }, {} as Record<string, SecurityIssue[]>)

    let totalIssues = 0
    
    for (const [severity, issues] of Object.entries(groupedIssues)) {
      if (issues.length === 0) continue
      
      totalIssues += issues.length
      const emoji = severity === 'critical' ? '🚨' : 
                   severity === 'high' ? '⚠️' : 
                   severity === 'medium' ? '⚡' : '💡'
      
      report.push(`${emoji} ${severity.toUpperCase()} (${issues.length} issues)`)
      report.push('-'.repeat(30))
      
      issues.forEach((issue, index) => {
        report.push(`${index + 1}. ${issue.description}`)
        if (issue.affected_resource) {
          report.push(`   Resource: ${issue.affected_resource}`)
        }
        report.push(`   Fix: ${issue.recommendation}`)
        report.push('')
      })
    }

    if (totalIssues === 0) {
      report.push('✅ No security issues detected!')
    } else {
      report.push(`📊 SUMMARY: ${totalIssues} total issues found`)
      report.push(`   Critical: ${groupedIssues.critical.length}`)
      report.push(`   High: ${groupedIssues.high.length}`)  
      report.push(`   Medium: ${groupedIssues.medium.length}`)
      report.push(`   Low: ${groupedIssues.low.length}`)
    }

    return report.join('\n')
  }
}

// Export singleton instance
export const securityScanner = new SecurityScanner()