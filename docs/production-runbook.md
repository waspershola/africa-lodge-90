# Production Runbook - Hotel Management System

## Emergency Contacts & Escalation

### Critical System Issues
- **Primary Oncall**: Lovable Support Team
- **Escalation**: System Administrator
- **Infrastructure**: Supabase Status Page

### Severity Levels
- **P0 (Critical)**: System down, data corruption, security breach
- **P1 (High)**: Major functionality broken, authentication issues
- **P2 (Medium)**: Feature degradation, performance issues
- **P3 (Low)**: Minor bugs, cosmetic issues

## Critical Edge Functions Monitoring

### Key Functions to Monitor
1. `create-tenant-and-owner` - Tenant onboarding
2. `invite-user` - User management
3. `delete-user` - User cleanup
4. `trial-signup` - Trial registrations
5. `suspend-user` - Account management

### Alert Thresholds
- Error rate > 5% over 5 minutes
- Average latency > 10 seconds
- Function execution failures > 10/minute
- Success rate < 95% over 15 minutes

## Rollback Procedures

### Database Migration Rollback

```sql
-- Emergency rollback template
BEGIN;

-- 1. Verify current migration state
SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 5;

-- 2. Rollback to previous version (replace with actual version)
DELETE FROM supabase_migrations.schema_migrations WHERE version = '20250922_latest';

-- 3. Execute rollback SQL (prepare specific rollback scripts)
-- [INSERT ROLLBACK SQL HERE]

-- 4. Verify rollback success
SELECT count(*) FROM public.users;
SELECT count(*) FROM public.tenants;

COMMIT;
-- or ROLLBACK; if issues detected
```

### Edge Function Rollback

```bash
# 1. Identify problematic deployment
curl -X GET "https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/health-check" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# 2. Redeploy previous version (if available)
supabase functions deploy --project-ref dxisnnjsbuuiunjmzzqj

# 3. Verify functionality
newman run backend-audit/tests/postman_collection_updated.json
```

### Feature Flag Rollback

```sql
-- Disable problematic features immediately
UPDATE public.feature_flags 
SET is_enabled = false 
WHERE flag_name IN ('new-tenant-flow', 'enhanced-invite-system');

-- Verify change
SELECT flag_name, is_enabled FROM public.feature_flags WHERE is_enabled = false;
```

## Incident Response Procedures

### P0 - Critical System Down

1. **Immediate Response (0-5 minutes)**
   ```bash
   # Check system health
   curl -f "https://preview--africa-lodge-90.lovable.app/health" || echo "Frontend DOWN"
   curl -f "https://dxisnnjsbuuiunjmzzqj.supabase.co/rest/v1/" || echo "Database DOWN"
   
   # Check edge functions
   for func in create-tenant-and-owner invite-user trial-signup; do
     curl -X POST "https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/$func" \
       -H "Content-Type: application/json" \
       -d '{"test": true}' || echo "$func DOWN"
   done
   ```

2. **Investigation (5-15 minutes)**
   - Check Supabase dashboard for alerts
   - Review edge function logs from last 30 minutes
   - Check database connection pools
   - Verify RLS policies haven't changed

3. **Mitigation (15-30 minutes)**
   - Execute appropriate rollback procedure
   - Enable maintenance page if needed
   - Notify users via status page

### P1 - Authentication Issues

1. **Diagnosis**
   ```sql
   -- Check auth system health
   SELECT count(*) FROM auth.users WHERE created_at > now() - interval '1 hour';
   
   -- Verify helper functions
   SELECT debug_auth_context();
   SELECT is_super_admin();
   
   -- Check RLS policies
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE tablename IN ('users', 'tenants', 'roles');
   ```

2. **Common Fixes**
   ```sql
   -- Reset stuck auth states
   UPDATE auth.users SET email_confirmed_at = now() 
   WHERE email_confirmed_at IS NULL AND created_at < now() - interval '1 day';
   
   -- Clear problematic sessions
   DELETE FROM auth.sessions WHERE created_at < now() - interval '7 days';
   ```

### P2 - Edge Function Failures

1. **Log Analysis**
   ```bash
   # Fetch recent logs for failed function
   supabase functions logs create-tenant-and-owner --limit 100 --project-ref dxisnnjsbuuiunjmzzqj
   ```

2. **Common Issues & Fixes**
   - **Role lookup failures**: Update to case-insensitive lookup
   - **Plan ID errors**: Verify starter plan exists
   - **Token expiration**: Implement token refresh logic
   - **Database constraints**: Check foreign key relationships

## Health Checks & Monitoring

### Automated Health Checks

```bash
#!/bin/bash
# health-check.sh - Run every 5 minutes

# Function health check
check_function() {
  local func_name=$1
  local response=$(curl -s -w "%{http_code}" -X POST \
    "https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/$func_name" \
    -H "Content-Type: application/json" \
    -d '{"health_check": true}')
  
  if [[ "${response: -3}" != "200" ]]; then
    echo "ALERT: $func_name returned ${response: -3}"
    # Send alert to monitoring system
  fi
}

# Check critical functions
check_function "create-tenant-and-owner"
check_function "invite-user"
check_function "trial-signup"

# Database health check
psql "$SUPABASE_DB_URL" -c "SELECT 1" > /dev/null 2>&1 || {
  echo "ALERT: Database connection failed"
}
```

### Manual Health Verification

```sql
-- Production health checklist
-- 1. Verify critical tables exist and have data
SELECT 
  'users' as table_name, count(*) as row_count FROM public.users
UNION ALL
SELECT 
  'tenants' as table_name, count(*) as row_count FROM public.tenants
UNION ALL
SELECT 
  'roles' as table_name, count(*) as row_count FROM public.roles
UNION ALL
SELECT 
  'plans' as table_name, count(*) as row_count FROM public.plans;

-- 2. Check recent activity
SELECT 
  date_trunc('hour', created_at) as hour,
  count(*) as new_tenants
FROM public.tenants 
WHERE created_at > now() - interval '24 hours'
GROUP BY 1 ORDER BY 1;

-- 3. Verify RLS is active
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity IS NOT TRUE;

-- Should return no rows - all tables should have RLS enabled
```

## Performance Optimization

### Database Optimization

```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements 
WHERE calls > 100 
ORDER BY mean_time DESC 
LIMIT 10;

-- Index optimization
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats 
WHERE schemaname = 'public' 
ORDER BY n_distinct DESC;

-- Connection monitoring
SELECT count(*) as active_connections,
       max(now() - query_start) as longest_query_time
FROM pg_stat_activity 
WHERE state = 'active';
```

### Edge Function Optimization

- Monitor memory usage and cold starts
- Optimize database connection pooling
- Implement caching for frequently accessed data
- Use background tasks for non-critical operations

## Backup & Recovery

### Database Backup Verification

```bash
# Verify automated backups exist
supabase db dump --data-only --project-ref dxisnnjsbuuiunjmzzqj > backup-test.sql
wc -l backup-test.sql  # Should have substantial line count

# Test restore procedure (staging only)
supabase db reset --project-ref staging-project-id
supabase db push --project-ref staging-project-id < backup-test.sql
```

### Point-in-Time Recovery

1. Identify recovery point from Supabase dashboard
2. Create new database instance from backup
3. Update DNS to point to new instance
4. Verify data integrity and user access
5. Update connection strings in edge functions

## Security Incident Response

### Data Breach Response

1. **Immediate Actions (0-1 hour)**
   - Isolate affected systems
   - Preserve evidence/logs
   - Assess scope of breach
   - Notify security team

2. **Investigation (1-24 hours)**
   - Analyze audit logs
   - Identify attack vectors
   - Determine data accessed
   - Document timeline

3. **Recovery (24-72 hours)**
   - Patch vulnerabilities
   - Reset compromised credentials
   - Update security policies
   - Monitor for persistent threats

### RLS Policy Breach

```sql
-- Emergency: Disable public access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Verify policy effectiveness
SELECT schemaname, tablename, policyname, permissive, roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test policy with anonymous user
SET ROLE anon;
SELECT count(*) FROM public.users; -- Should fail
RESET ROLE;
```

## Communication Templates

### Status Page Updates

**P0 Incident**
```
🚨 INVESTIGATING: We are currently experiencing issues with our authentication system. 
New user signups and logins may be affected. We are actively investigating and will 
provide updates every 15 minutes. 
ETA for resolution: 30 minutes
```

**Resolution**
```
✅ RESOLVED: All systems are now operational. The authentication issue has been 
resolved and all services are functioning normally. We apologize for any inconvenience.
Root cause: [Brief technical explanation]
```

### Internal Escalation

**P1 Alert Template**
```
Subject: P1 Alert - Edge Function Failure Rate Spike

System: Hotel Management Platform
Function: invite-user
Error Rate: 15% (threshold: 5%)
Duration: 10 minutes
Impact: User invitations failing

Actions Taken:
- Checked logs: [key findings]
- Verified database: [status]
- Current investigation: [what we're doing]

Next Steps:
- [planned actions with timeline]
```

## Testing & Validation

### Pre-deployment Checklist

- [ ] Run full Postman collection
- [ ] Execute security test suite
- [ ] Verify RLS policies with test users
- [ ] Check edge function performance
- [ ] Validate backup/restore procedures
- [ ] Test rollback procedures

### Post-deployment Validation

```bash
# Comprehensive system validation
newman run backend-audit/tests/postman_collection_updated.json \
  --environment production.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export validation-results.json

# Check validation results
jq '.run.stats' validation-results.json
```

## Maintenance Windows

### Scheduled Maintenance Process

1. **Pre-maintenance (24 hours before)**
   - Notify users via email/dashboard
   - Update status page
   - Prepare rollback scripts
   - Verify backup integrity

2. **During Maintenance**
   - Enable maintenance mode
   - Execute changes with monitoring
   - Validate each step
   - Document any issues

3. **Post-maintenance**
   - Run full validation suite
   - Monitor system metrics
   - Disable maintenance mode
   - Send completion notification

### Emergency Maintenance

For critical security patches or system failures:
1. Immediate notification to all users
2. Enable maintenance page within 5 minutes
3. Execute fixes with continuous monitoring
4. Validate fix before re-enabling access
5. Post-incident review within 24 hours

---

**Last Updated**: 2024-09-22  
**Document Owner**: System Administrator  
**Review Schedule**: Monthly or after major incidents