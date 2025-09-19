# Backend Implementation Plan - Prioritized

## Phase 1: Foundation (Week 1) - CRITICAL
**Goal**: Enable Supabase integration and fix auth system

### 1.1 Supabase Connection (Day 1)
- [ ] Click green Supabase button in Lovable UI
- [ ] Execute `001_schema.sql` in Supabase SQL Editor
- [ ] Execute `002_rls_policies.sql` in Supabase SQL Editor
- [ ] Verify tables and policies created successfully

### 1.2 Auth System Consolidation (Day 2)
- [ ] Update all POS components to use `MultiTenantAuthProvider`
- [ ] Delete `src/hooks/useAuth.ts` (legacy)
- [ ] Replace localStorage auth with Supabase Auth
- [ ] Test login/logout flows

### 1.3 Security Hardening (Day 3)
- [ ] Remove all localStorage token storage
- [ ] Implement httpOnly cookie sessions via Supabase
- [ ] Add CSRF protection
- [ ] Configure CORS settings

## Phase 2: Data Layer (Week 2) - HIGH PRIORITY
**Goal**: Replace mock data with real Supabase operations

### 2.1 Core Entities (Days 4-6)
- [ ] Replace `useMultiTenantAuth` mock data with Supabase queries
- [ ] Implement real tenant/user CRUD operations
- [ ] Update `useOnboarding` with Supabase persistence
- [ ] Test tenant isolation with RLS policies

### 2.2 Hotel Operations (Days 7-9) 
- [ ] Rooms management (`src/hooks/useConfiguration.ts`)
- [ ] Reservations system (`src/components/frontdesk/`)
- [ ] Billing integration (`src/hooks/useCheckout.ts`)
- [ ] QR code generation and management

### 2.3 Staff Operations (Days 10-11)
- [ ] Housekeeping tasks (`src/hooks/useHousekeepingApi.ts`)
- [ ] Maintenance work orders (`src/hooks/useMaintenanceApi.ts`)
- [ ] POS orders (`src/hooks/usePOSApi.ts`)

## Phase 3: Real-time & Advanced Features (Week 3)
**Goal**: Live updates and operational features

### 3.1 Realtime Subscriptions (Days 12-14)
- [ ] QR order notifications for staff dashboards
- [ ] POS kitchen display updates
- [ ] Room status change broadcasts
- [ ] Housekeeping task assignments

### 3.2 Payment Integration (Days 15-16)
- [ ] Paystack webhook handler (Edge Function)
- [ ] Stripe webhook handler (Edge Function)  
- [ ] Payment recording and reconciliation
- [ ] Subscription billing automation

### 3.3 Offline Sync (Days 17-18)
- [ ] IndexedDB action queue implementation
- [ ] Sync reconciliation API endpoints
- [ ] Conflict resolution logic
- [ ] Background sync service worker

## Phase 4: Production Readiness (Week 4)
**Goal**: Security, monitoring, and deployment

### 4.1 Security & Compliance (Days 19-20)
- [ ] Audit log implementation for all actions
- [ ] Rate limiting on sensitive endpoints
- [ ] Data encryption for PII fields
- [ ] Security scan and penetration testing

### 4.2 Performance & Monitoring (Day 21)
- [ ] Database query optimization
- [ ] API response caching strategies
- [ ] Error tracking and logging
- [ ] Performance monitoring setup

## Implementation Notes

### Database-First Approach
1. All changes start with database schema updates
2. Add migrations for any schema changes  
3. Update RLS policies for new tables/columns
4. Test policies before frontend integration

### Frontend Integration Pattern
```typescript
// Replace mock pattern:
const mockData = [...];
setData(mockData);

// With Supabase pattern:
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('tenant_id', tenant.tenant_id);
if (error) throw error;
setData(data);
```

### Testing Strategy
- Unit tests for business logic functions
- Integration tests for API endpoints  
- E2E tests for critical user flows
- Load testing for multi-tenant scenarios

### Deployment Sequence
1. Database migrations (Supabase)
2. Edge Functions deployment
3. Frontend code updates (Lovable)
4. Webhook configuration (Payment providers)
5. DNS and SSL setup (Custom domain)

## Success Criteria
- [ ] Zero mock data in production code
- [ ] All RLS policies tested and working
- [ ] Real-time updates functioning
- [ ] Payment processing operational
- [ ] Security audit passed
- [ ] Performance benchmarks met