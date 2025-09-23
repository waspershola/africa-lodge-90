# Owner Dashboard → Production Plan
## Hotel Management System - Complete Production Deployment Strategy

### Executive Summary
Transform the Owner Dashboard's 12 navigation modules into a fully production-ready, tenant-isolated hotel management system. This phased approach ensures secure deployment with real Supabase data, robust authentication, and enterprise-grade reliability.

**Current Status:**
- Frontend/UI: 100% Production Ready ✅  
- Backend/Database: 85% Ready ⚠️
- Timeline: 18-29 working days (3-6 weeks)

### High-Level Goals
- All 12 nav modules backed by real Supabase data (no mock fallbacks)
- Strict tenant isolation (RLS + JWT claims)
- Robust staff invite/password workflow
- Production-ready APIs, realtime, reports, audit, and backups
- Phased delivery with verification at each stage

---

## Phase 0: Prep & Safety (Day 0 - Mandatory)
**Duration:** 0.5 day | **Priority:** CRITICAL

### Goals
Ensure safe deployment environment, secrets, and backups before changes.

### Tasks
- [ ] **Database Backup**
  - Create full DB snapshot using `supabase db dump`
  - Export current schema for rollback reference
  - Document current RLS policies state

- [ ] **Security Audit**
  - Verify/rotate secrets: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`
  - Validate SMTP credentials and payment webhook secrets
  - Review edge function environment variables

- [ ] **Environment Setup**
  - Create staging environment (mirror prod schema)
  - Set up dev environment for testing
  - Configure CI/CD pipeline for edge functions and migrations

### Acceptance Criteria
- ✅ DB snapshot exists and verified
- ✅ All environment variables validated in Supabase Dashboard
- ✅ Staging environment available and isolated

### Rollback Plan
- Restore DB snapshot if any migration issues
- Revert to previous environment configuration

---

## Phase 1: Core Tenant Infrastructure & Security (1-2 days)
**Duration:** 1-2 days | **Priority:** CRITICAL

### Goals
Ensure tenant isolation, establish baseline indexes, complete core tables, and secure RLS policies.

### Database Tasks
- [ ] **Core Tables Verification**
  - Ensure these tables exist with `tenant_id`: tenants, users, roles, plans, reservations, rooms, room_types, folios, folio_charges, payments, guests, housekeeping_tasks, work_orders, qr_codes, qr_orders, audit_log, branding_assets, hotel_settings, payment_methods, power_logs, fuel_logs

- [ ] **Performance Indexes**
  ```sql
  CREATE INDEX idx_reservations_tenant_dates ON reservations(tenant_id, check_in_date, check_out_date, status);
  CREATE INDEX idx_payments_tenant_created ON payments(tenant_id, created_at, payment_method);
  CREATE INDEX idx_folio_charges_folio_posted ON folio_charges(folio_id, created_at);
  CREATE INDEX idx_users_tenant ON users(tenant_id);
  CREATE INDEX idx_roles_tenant ON roles(tenant_id);
  ```

- [ ] **Helper Functions**
  - Confirm SECURITY DEFINER functions exist: `is_super_admin()`, `get_user_tenant_id()`, `get_user_role()`, `can_access_tenant()`

### RLS Tasks
- [ ] **Tenant Scoping Enforcement**
  - Apply tenant scoping on SELECT/INSERT/UPDATE/DELETE for all tenant-scoped tables
  - Example: `USING ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id OR is_super_admin())`
  - Lockdown sensitive global tables (plans, feature_flags) for super-admin only

### Edge Functions
- [ ] **Core Functions Verification**
  - Ensure `create-tenant-and-owner`, `create-global-user`, `invite-user`, `send-temp-password` use `SUPABASE_SERVICE_ROLE_KEY`
  - Validate `trial-signup` works via service-edge function

### Frontend Updates
- [ ] **Authentication Provider**
  - Update global auth provider to include `tenant_id` claim in JWT/session
  - Block UI routes for owner until `tenants.setup_completed = true`

### Acceptance Criteria
- ✅ All queries from staging return tenant-scoped rows only
- ✅ RLS tests pass in automated suite
- ✅ Helper functions verified and working

### Rollback Plan
- Revert RLS changes and restore snapshots if policy mistakes cause lockouts

---

## Phase 2: Authentication & Staff Management (2-3 days)
**Duration:** 2-3 days | **Priority:** HIGH

### Goal
Owner can invite staff (secure temp password), reset staff passwords; Super Admin protected.

### Database Tasks
- [ ] **User Schema Enhancement**
  - Ensure `public.users` has columns: `id` (uuid auth id), `email`, `role_id`, `role` (legacy), `tenant_id`, `force_reset` boolean, `temp_password_hash`, `temp_expires`, `is_active`
  - Add index: `users(email)`

### Edge Functions
- [ ] **Robust User Management**
  - Deploy `create-global-user-fixed` for global and tenant invites
  - Use service-role for DB writes
  - Accept `{email, name, role, tenant_id?}` payload
  - Create auth user, write `public.users`, set `force_reset=true`, `temp_expires=now()+24h`
  - Return `tempPassword` to caller if email sending fails
  - Include rollback mechanism with audit entry

- [ ] **Email Service**
  - `send-temp-password` edge function using Resend/SMTP
  - Non-blocking: if email fails, return success with `tempPassword` string for admin copy

### Frontend Implementation
- [ ] **User Management Interface**
  - Replace tenant/global "Create User" forms with single form calling `invite-user` edge function
  - UI options: "Send by email" (default) or "Return temp password to copy"
  - Force reset enforced at login: check `public.users.force_reset`

### Login Flow Enhancement
- [ ] **Force Reset Implementation**
  - On login, after Supabase auth success, fetch `public.users` for `auth.uid`
  - If `force_reset === true`: redirect to `/auth/reset-password?temp=true`
  - Block other routes until password reset
  - On successful reset, clear `force_reset` and `temp_password_hash`

### Acceptance Criteria
- ✅ Owner invites staff, staff receives email (or admin gets temp password)
- ✅ First login forces reset
- ✅ Super Admin account immutable (cannot be deleted)

### Testing
- Unit tests for edge functions
- E2E invite flow: create invite → email delivery → first-login reset

---

## Phase 3: Reservations, Rooms & Rates (3-5 days)
**Duration:** 3-5 days | **Priority:** CRITICAL

### Goal
Complete reservations CRUD, calendar, availability, room inventory, rate plans.

### Database & RPCs
- [ ] **Rate Management**
  - Create `rate_plans`, `rates_by_date` (if dynamic pricing required)

- [ ] **Core RPCs Implementation**
  ```sql
  -- Check room availability
  fn_check_availability(property_id, room_type_id, start_ts, end_ts) → returns available_count
  
  -- Atomic reservation creation
  create_reservation_atomic(tenant_id, payload) → 
    - checks availability (locks)
    - creates reservation + folio + initial charges
    - returns reservation_id
  ```

- [ ] **Performance Optimization**
  - Materialized view: `mv_availability` (optional for performance)

### RLS Considerations
- [ ] **Security Implementation**
  - Ensure `create_reservation_atomic` called from edge functions (service role)
  - Allow clients to read availability via safe function/policy

### Edge Functions / APIs
- [ ] **Reservation Management**
  - `reservations.create` → validates payload, calls RPC
  - `reservations.update/cancel` → handle inventory release and folio adjustments

### Frontend Integration
- [ ] **Live Data Connection**
  - Hook `useReservations` to call real APIs
  - Calendar view connected to `fn_check_availability` and reservation endpoints
  - Drag-n-drop mapped to update API

### Acceptance Criteria
- ✅ Create, update, cancel flows work
- ✅ Availability prevents double-booking
- ✅ Calendar shows real availability and updates on create/cancel

### Testing
- Concurrency test for double-booking (simulate race)
- E2E booking case

---

## Phase 4: Guests & Housekeeping (2-3 days)
**Duration:** 2-3 days | **Priority:** HIGH

### Goal
Complete guests directory, profiles, corporate accounts, housekeeping task board.

### Database Tasks
- [ ] **Guest Management**
  - `guests` table: `id`, `tenant_id`, `profile_id`, `first_name`, `last_name`, `email`, `phone`, `company_id`, `country`, `created_at`
  - `corporate_accounts` (optional) for company billing terms

- [ ] **Housekeeping System**
  - `housekeeping_tasks` table + `task_checklist` and `supply_inventory`

### Edge Functions / APIs
- [ ] **Guest Operations**
  - Guest merge/import (from reservations to guests)

- [ ] **Housekeeping Endpoints**
  - Create task, assign, update status → triggers and audit

### Frontend Integration
- [ ] **Live Components**
  - Guests list uses `useGuests` connecting to guests table
  - Housekeeping Kanban bound to `housekeeping_tasks` realtime channel

### Acceptance Criteria
- ✅ Guest profiles persist and show booking history
- ✅ Housekeeping tasks create and real-time updates reflect in staff dashboards

---

## Phase 5: Billing, Payments & Financials (3-5 days)
**Duration:** 3-5 days | **Priority:** CRITICAL

### Goal
Complete billing flows (folio management), payment methods, receipts, debt tracking, currency settings.

### Database Tasks
- [ ] **Financial Schema**
  - Ensure `folios`, `folio_charges`, `payments` tables complete with `tenant_id`, `currency`, `status`
  - Add `payment_methods` and `payment_modes` (moniepoint, oPay, cash, transfer, debtor, pay-later)
  - Add `receipts_templates`/`branding_assets` for receipts (A4 / POS slip)

### RPCs & Triggers
- [ ] **Financial Calculations**
  ```sql
  fn_folio_balance(folio_id) and view_folio_balances for outstanding calculations
  
  -- Auto-update triggers
  ON payments INSERT → update folios.total_payments and folios.status
  ON folio_charges INSERT → update folios.total_charges
  ```

### Edge Functions / Webhooks
- [ ] **Payment Processing**
  - Payment webhook handlers (Paystack/Moniepoint)
  - Verify signatures and mark payments
  - Short-circuit offline payments: manual entry via POS API

### Frontend Integration
- [ ] **Billing Interface**
  - Billing page uses live folio balances
  - Print receipt button uses pre-configured template based on tenant settings
  - Payment UI supports multiple payment modes

### Acceptance Criteria
- ✅ Payments recorded, folio balance updates
- ✅ Receipts generate in correct format with branding

### Testing
- Payment webhook simulation
- Receipt generation (A4 and POS)

---

## Phase 6: QR Manager & Guest Portal (2-3 days)
**Duration:** 2-3 days | **Priority:** HIGH

### Goal
Unified per-room QR codes, QR portal guest flows, routing requests to staff.

### Database Tasks
- [ ] **QR System Schema**
  - `qr_codes` table: `id`, `tenant_id`, `context` (room|global|location), `room_id`, `services` jsonb, `branding_options`, `active`
  - `qr_orders` table: `id`, `tenant_id`, `qr_id`, `room_id`, `guest_info`, `service_type`, `status`, `assigned_to_user`, `created_at`

### Edge Functions / APIs
- [ ] **QR Management**
  - `qr.generate_per_room(tenant_id, room_id, services[])` → create QR code record + return PNG/URL
  - `qr.scan` endpoint (anonymous) → resolve to tenant and room, return unified services UI

- [ ] **Guest Request Routing**
  - Guest submits request → insert into `qr_orders`
  - Push realtime notifications to relevant staff channels

### Frontend Integration
- [ ] **QR Management Interface**
  - Owner Dashboard QR Manager connected to `qr_codes` table
  - Generation, preview, and bulk export
  - Guest QR Portal (anonymous) with tenant-scoped view

### Acceptance Criteria
- ✅ Per-room QR works: scan → shows services → requests create orders
- ✅ Staff get real-time notifications

### Testing
- Guest scan flows
- Order routing tests to POS and Housekeeping dashboards

---

## Phase 7: Reports, Analytics, Performance (3-5 days)
**Duration:** 3-5 days | **Priority:** HIGH

### Goal
Complete analytics (ADR, RevPAR, revenue trends), materialized views, performance optimizations.

### Database Tasks
- [ ] **Analytics Infrastructure**
  ```sql
  -- Materialized views
  mv_daily_revenue_by_tenant
  mv_occupancy_by_date
  mv_guest_stats_monthly
  
  -- Analytics RPCs
  fn_adr, fn_revpar, fn_daily_revenue
  ```

- [ ] **Automated Refresh**
  - Schedule cron job to refresh MVs (every 10 min for near-real-time, nightly full rebuild)

### Performance Optimization
- [ ] **Infrastructure Enhancement**
  - Add performance indexes
  - Optional cache tier (Redis/Cloud caching) for heavy dashboards

### Frontend Integration
- [ ] **Live Analytics**
  - Replace mock charts with real-time charts backed by materialized views
  - Implement pagination and lazy loading on large lists

### Acceptance Criteria
- ✅ Dashboard KPIs match nightly accounting
- ✅ MV refresh times acceptable and queries <500ms under load

### Testing
- Load test with k6 (target: 1000 concurrent users across tenants)
- Validate RLS isolation under load

---

## Phase 8: Power & Fuel, Finishing Touches & Go-Live (2-3 days)
**Duration:** 2-3 days | **Priority:** EXECUTION

### Goal
Complete Power & Fuel module, final QA, deploy to production.

### Database Tasks
- [ ] **Utilities Management**
  - `power_logs` + `fuel_logs` tables
  - Triggers for monthly cost aggregations
  - `mv_power_usage` materialized view

### Frontend Completion
- [ ] **Final Module**
  - Power & Fuel dashboard tied to asset monitoring flows

### Final QA
- [ ] **Comprehensive Testing**
  - Cross-role walkthrough (Owner, Manager, Front Desk, POS, Housekeeping, Maintenance, Super Admin)
  - Run test cases from all phases
  - Verify backup & disaster recovery

### Go-Live Execution
- [ ] **Production Deployment**
  - Switch staging → prod via promotion steps in pipeline
  - Announce maintenance window and migrate final seed data
  - Monitor logs and performance 48-72 hours

### Acceptance Criteria
- ✅ All 12 modules fully functional
- ✅ Production monitoring active
- ✅ Backup procedures verified

---

## Timeline Summary

| Phase | Duration | Priority | Focus |
|-------|----------|----------|-------|
| Phase 0 | 0.5 day | CRITICAL | Prep & Safety |
| Phase 1 | 1-2 days | CRITICAL | Core Infrastructure |
| Phase 2 | 2-3 days | HIGH | Authentication |
| Phase 3 | 3-5 days | CRITICAL | Reservations |
| Phase 4 | 2-3 days | HIGH | Guests & Housekeeping |
| Phase 5 | 3-5 days | CRITICAL | Billing & Payments |
| Phase 6 | 2-3 days | HIGH | QR Management |
| Phase 7 | 3-5 days | HIGH | Analytics |
| Phase 8 | 2-3 days | EXECUTION | Final Launch |

**Total: 18-29 working days (3-6 weeks)**

---

## Testing & Acceptance Strategy

### Always Required
- [ ] Unit tests for RPCs & edge functions
- [ ] Integration tests for RLS and role behaviors
- [ ] E2E invite flow testing
- [ ] Security tests: verify RLS prevents cross-tenant reads/writes
- [ ] Load testing: 1000 concurrent users
- [ ] Cutover test: staging → production smoke tests

### Rollback & Safety Recommendations
- [ ] Always run migrations in staging first
- [ ] Keep DB snapshot before any destructive change
- [ ] Edge functions deployed with versioned routes for quick rollback
- [ ] If any phase causes data issues, revert to previous snapshot and disable newly deployed edge function

---

## Deliverables for Each Phase

### For Lovable Implementation
Each phase provides:
- [ ] SQL migration file(s) (non-destructive first, destructive only after approval)
- [ ] Edge Functions (Deno/TypeScript) using `SUPABASE_SERVICE_ROLE_KEY`
- [ ] RLS policy scripts to apply and test
- [ ] Frontend mapping: components/hooks to switch from mock → real endpoints
- [ ] Test suite changes (Postman/Cypress/Vitest)
- [ ] Deployment plan (staging → prod promotion)

### Quick Copy-Paste Task List
1. Create DB indexes and verify helper functions
2. Harden RLS policies for tenant tables
3. Deploy `create-global-user-fixed` / `invite-user-fixed`
4. Implement `create_reservation_atomic`, `fn_check_availability`, `fn_adr`, `fn_revpar`
5. Connect frontend hooks (`useReservations`, `useGuests`, `useBilling`, `useQR`) to real endpoints
6. Remove mock files and delete duplicates
7. Implement materialized views and nightly refresh
8. QA & E2E test, promote to production

---

## Success Metrics
- ✅ All 12 modules backed by real Supabase data
- ✅ 100% tenant isolation verified
- ✅ Staff authentication & invite workflow operational
- ✅ Revenue calculations (ADR, RevPAR) accurate
- ✅ API performance <500ms under load
- ✅ Mobile responsive across all features
- ✅ Zero critical security vulnerabilities
- ✅ Production monitoring and backup systems active