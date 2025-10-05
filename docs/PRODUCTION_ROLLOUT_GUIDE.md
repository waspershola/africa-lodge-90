# Production Rollout Guide
## QR Unified Service - Phase 3 Implementation

**Version:** 1.0  
**Last Updated:** 2025-10-05  
**Owner:** Engineering Team

---

## Overview

This guide provides step-by-step instructions for deploying the QR Unified Service to production, including feature flags, monitoring, and rollback procedures.

---

## Pre-Deployment Checklist

### 1. Environment Verification
- [ ] Verify Supabase project is accessible
- [ ] Confirm edge function `qr-unified-api` is deployed
- [ ] Verify all database tables exist with correct schemas
- [ ] Confirm RLS policies are enabled on all tables
- [ ] Test rate limiting configuration (10/20/60 req/min)

### 2. Security Validation
- [ ] Run security linter: `supabase db lint`
- [ ] Verify JWT secret rotation (if applicable)
- [ ] Confirm HTTPS enforcement on all endpoints
- [ ] Test rate limiting with realistic load
- [ ] Verify tenant isolation with cross-tenant queries

### 3. Data Migration
- [ ] Backup existing QR codes data
- [ ] Run migration scripts for unified schema
- [ ] Verify data integrity post-migration
- [ ] Test rollback procedure on staging

### 4. Testing Validation
- [ ] Run full E2E test suite: `npm run cypress:run`
- [ ] Verify camera QR scanning on iOS/Android
- [ ] Test offline sync on flaky networks
- [ ] Validate short URL creation/redirection
- [ ] Check analytics dashboard performance

---

## Feature Flag Configuration

### Enable Feature Flag
```sql
-- Enable for canary tenants first
UPDATE feature_flags 
SET is_enabled = true,
    target_tenants = ARRAY['tenant-uuid-1', 'tenant-uuid-2']
WHERE flag_name = 'ff/qr_unified_portal';

-- After validation, enable for all
UPDATE feature_flags 
SET is_enabled = true,
    target_tenants = NULL
WHERE flag_name = 'ff/qr_unified_portal';
```

### Feature Flag Structure
```javascript
{
  flag_name: 'ff/qr_unified_portal',
  is_enabled: true,
  target_tenants: ['uuid1', 'uuid2'], // null = all tenants
  config: {
    camera_enabled: true,
    offline_enabled: true,
    short_urls_enabled: true,
    max_requests_per_session: 10
  }
}
```

---

## Deployment Steps

### Phase 1: Staging Deployment (Week 1)

#### Day 1-2: Deploy to Staging
```bash
# 1. Deploy edge function
cd supabase/functions/qr-unified-api
supabase functions deploy qr-unified-api --project-ref <staging-ref>

# 2. Deploy short URL function
cd supabase/functions/url-shortener
supabase functions deploy url-shortener --project-ref <staging-ref>

# 3. Run database migrations
supabase db push --project-ref <staging-ref>

# 4. Deploy frontend
npm run build
# Deploy to staging environment (Lovable auto-deploys)
```

#### Day 3-5: Manual QA Testing
- **Camera Scanning:**
  - iPhone 12+ (iOS 15+)
  - Samsung Galaxy S21+ (Android 11+)
  - Huawei devices (file fallback)

- **Offline Sync:**
  - Simulate airplane mode
  - Test network reconnection
  - Verify IndexedDB persistence

- **Performance:**
  - Session creation < 2s
  - Request creation < 1s
  - Page load < 3s (3G network)

#### Day 6-7: Load Testing
```bash
# K6 load test (100 concurrent users)
k6 run --vus 100 --duration 5m tests/load/qr-scan.js

# Expected metrics:
# - 95th percentile < 2s
# - Error rate < 1%
# - Rate limit triggers correctly
```

---

### Phase 2: Canary Rollout (Week 2)

#### Select Canary Tenants
- **Criteria:**
  - Active usage (>50 guests/week)
  - Technical proficiency (can report issues)
  - Diverse use cases (hotel, restaurant, spa)

#### Enable for Canary (2 Tenants)
```sql
UPDATE feature_flags 
SET is_enabled = true,
    target_tenants = ARRAY[
      'canary-tenant-1-uuid',
      'canary-tenant-2-uuid'
    ]
WHERE flag_name = 'ff/qr_unified_portal';
```

#### Monitoring Window (48-72 hours)
- **Key Metrics:**
  - QR scan success rate: Target >95%
  - Session creation latency: Target <2s
  - Request completion rate: Target >95%
  - Error rate: Target <1%

- **Feedback Collection:**
  - Daily check-ins with canary tenants
  - Review Supabase edge function logs
  - Monitor Sentry error reports

---

### Phase 3: Gradual Rollout (Week 3)

#### Day 1: 25% Rollout
```sql
-- Get 25% of active tenants
WITH active_tenants AS (
  SELECT tenant_id 
  FROM tenants 
  WHERE is_active = true 
  ORDER BY created_at 
  LIMIT (SELECT COUNT(*) * 0.25 FROM tenants WHERE is_active = true)
)
UPDATE feature_flags 
SET target_tenants = ARRAY(SELECT tenant_id FROM active_tenants)
WHERE flag_name = 'ff/qr_unified_portal';
```

**Monitoring:** 24 hours

#### Day 3: 50% Rollout
```sql
-- Increase to 50% of tenants
WITH active_tenants AS (
  SELECT tenant_id 
  FROM tenants 
  WHERE is_active = true 
  ORDER BY created_at 
  LIMIT (SELECT COUNT(*) * 0.5 FROM tenants WHERE is_active = true)
)
UPDATE feature_flags 
SET target_tenants = ARRAY(SELECT tenant_id FROM active_tenants)
WHERE flag_name = 'ff/qr_unified_portal';
```

**Monitoring:** 48 hours

#### Day 5: 100% Rollout
```sql
-- Enable for all tenants
UPDATE feature_flags 
SET is_enabled = true,
    target_tenants = NULL
WHERE flag_name = 'ff/qr_unified_portal';
```

---

## Monitoring Dashboard Setup

### 1. Supabase Analytics
- Navigate to: `Supabase > Project > Analytics`
- Create custom queries for:
  - QR scan volume (hourly/daily)
  - Session creation rate
  - Request completion time
  - Error rate by endpoint

### 2. Edge Function Logs
```sql
-- Query edge function errors
SELECT * FROM edge_logs
WHERE function_name = 'qr-unified-api'
  AND status_code >= 400
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

### 3. Database Performance
```sql
-- Monitor slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

## Rollback Procedures

### Immediate Rollback (Critical Issues)

#### Disable Feature Flag
```sql
-- Disable feature immediately
UPDATE feature_flags 
SET is_enabled = false
WHERE flag_name = 'ff/qr_unified_portal';
```

**Recovery Time:** < 5 minutes

#### Revert Database Migration
```bash
# Rollback last migration
supabase db reset --version <previous-migration-id>
```

**Recovery Time:** 10-15 minutes

---

### Partial Rollback (Tenant-Specific Issues)

```sql
-- Remove problematic tenant from rollout
UPDATE feature_flags 
SET target_tenants = array_remove(target_tenants, 'problematic-tenant-uuid')
WHERE flag_name = 'ff/qr_unified_portal';
```

---

## Incident Response Playbook

### Severity Levels

#### P0 - Critical (Complete Outage)
- **Response Time:** < 15 minutes
- **Actions:**
  1. Disable feature flag immediately
  2. Page on-call engineer
  3. Notify stakeholders
  4. Investigate root cause
  5. Deploy hotfix or full rollback

#### P1 - High (Degraded Service)
- **Response Time:** < 1 hour
- **Actions:**
  1. Identify affected tenants
  2. Partial rollback if localized
  3. Deploy fix within 4 hours
  4. Post-mortem within 24 hours

#### P2 - Medium (Minor Issues)
- **Response Time:** < 4 hours
- **Actions:**
  1. Document issue
  2. Prioritize fix for next deployment
  3. Communicate with affected tenants

---

## Post-Deployment Validation

### Week 1 After Full Rollout
- [ ] Review all P0/P1 incidents
- [ ] Analyze error rate trends
- [ ] Collect user feedback (NPS survey)
- [ ] Optimize slow queries
- [ ] Document lessons learned

### Week 2-4
- [ ] Fine-tune rate limits if needed
- [ ] Optimize offline sync strategy
- [ ] Enhance analytics dashboards
- [ ] Plan for Phase 4 features

---

## Success Metrics

### Technical KPIs
- **Uptime:** >99.9% (excluding planned maintenance)
- **QR Scan Success Rate:** >95%
- **Session Creation Latency:** <2s (p95)
- **Request Creation Latency:** <1s (p95)
- **Error Rate:** <1%

### Business KPIs
- **Guest Satisfaction:** >4.5/5.0
- **Request Completion Rate:** >95%
- **Average Response Time:** <10 minutes
- **Daily Active Scans:** Track trend growth

---

## Support Contacts

### Technical Escalation
- **Engineering Lead:** [Contact Info]
- **DevOps Lead:** [Contact Info]
- **On-Call Rotation:** [PagerDuty/Slack Channel]

### Business Escalation
- **Product Manager:** [Contact Info]
- **Customer Success:** [Contact Info]

---

## Appendix

### A. Database Schema Changes
See: `docs/SPRINT_2_IMPLEMENTATION.md` for complete schema

### B. API Endpoints
See: Edge function inline documentation

### C. Testing Scripts
Location: `cypress/e2e/qr-*.cy.ts`

---

**End of Document**
