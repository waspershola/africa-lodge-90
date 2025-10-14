# Trial Signup Edge Function Fix - Post-Mortem
**Date:** January 2025  
**Incident:** Non-2xx responses from trial-signup edge function  
**Status:** ✅ RESOLVED

---

## Executive Summary

The trial signup flow was failing with 500 Internal Server Error due to a database trigger referencing an incorrect column name. The `auto_seed_tenant_templates()` trigger was attempting to use `NEW.id` when the actual primary key column in the `tenants` table is `tenant_id`.

**Impact:**
- All trial signups failed
- Users received generic error messages
- No tenants could be created

**Root Cause:**
PostgreSQL error 42703 (`undefined_column`) - the trigger function referenced `NEW.id` which doesn't exist in the `tenants` table schema.

---

## Timeline

1. **Issue Detected:** Edge function logs showed repeated PostgreSQL error 42703
2. **Investigation:** Reviewed edge function logs, identified trigger as failure point
3. **Root Cause:** Found column name mismatch in `auto_seed_tenant_templates()`
4. **Fix Deployed:** Updated trigger to use `NEW.tenant_id`
5. **Enhancements:** Added error handling, monitoring, and tests

---

## Technical Details

### Original Problematic Code
```sql
CREATE OR REPLACE FUNCTION public.auto_seed_tenant_templates()
RETURNS trigger AS $$
BEGIN
  PERFORM seed_tenant_sms_templates(NEW.id);  -- ❌ WRONG: column doesn't exist
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Fixed Code
```sql
CREATE OR REPLACE FUNCTION public.auto_seed_tenant_templates()
RETURNS trigger AS $$
BEGIN
  BEGIN
    PERFORM seed_tenant_sms_templates(NEW.tenant_id);  -- ✅ CORRECT: uses actual PK
  EXCEPTION WHEN OTHERS THEN
    -- Non-blocking: log error but don't fail tenant creation
    INSERT INTO audit_log (...) VALUES (...);
    RAISE WARNING 'Template seeding failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Fix Implementation (6 Phases)

### Phase 1: Emergency Database Fix ✅
**Duration:** 5 minutes  
**Action:** Fixed trigger function to use `tenant_id`  
**Status:** Deployed and verified

### Phase 2: Add Error Monitoring ✅
**Duration:** 10 minutes  
**Action:** Made template seeding non-blocking with audit logging  
**Status:** Implemented in same migration

### Phase 3: Health Check Enhancement ✅
**Duration:** 15 minutes  
**Action:** Added trigger validation to health-check edge function  
**File:** `supabase/functions/health-check/index.ts`  
**Status:** Deployed

### Phase 4: Improved Error Handling ✅
**Duration:** 10 minutes  
**Action:** Added PostgreSQL error code handling in trial-signup  
**File:** `supabase/functions/trial-signup/index.ts`  
**Status:** Deployed

### Phase 5: Automated Testing ✅
**Duration:** 30 minutes  
**Action:** Created trigger validation test suite  
**File:** `supabase/tests/trigger-validation.sql`  
**Status:** Created (run after migrations)

### Phase 6: Documentation ✅
**Duration:** 10 minutes  
**Action:** This document + rollback plan  
**Status:** Complete

---

## Verification Steps

Run these commands to verify the fix:

### 1. Test Health Check
```typescript
const { data, error } = await supabase.functions.invoke('health-check');
console.log(data);
// Should show: status: 'healthy', database_triggers: { status: 'healthy' }
```

### 2. Test Trial Signup
```typescript
const { data, error } = await supabase.functions.invoke('trial-signup', {
  body: {
    hotel_name: 'Test Hotel',
    owner_name: 'Test Owner',
    owner_email: 'test@example.com',
    password: 'SecurePass123!'
  }
});
// Should succeed with { success: true }
```

### 3. Run Trigger Tests
```bash
# In Supabase SQL Editor
\i supabase/tests/trigger-validation.sql
# All tests should pass
```

---

## Rollback Plan

If the fix causes issues, use this emergency rollback:

```sql
-- Option 1: Temporarily disable trigger
ALTER TABLE tenants DISABLE TRIGGER trigger_auto_seed_tenant_templates;

-- Option 2: Revert to no-op version (allows signups, skips templates)
CREATE OR REPLACE FUNCTION public.auto_seed_tenant_templates()
RETURNS trigger AS $$
BEGIN
  RETURN NEW;  -- Do nothing, just return
END;
$$ LANGUAGE plpgsql;

-- Re-enable after investigation
ALTER TABLE tenants ENABLE TRIGGER trigger_auto_seed_tenant_templates;
```

---

## Prevention Measures

### 1. Coding Standards
- ✅ Use descriptive column names (`tenant_id` not `id`)
- ✅ Always add error handling to trigger functions
- ✅ Make non-critical operations non-blocking

### 2. Testing Requirements
- ✅ Run `trigger-validation.sql` after every migration
- ✅ Add trigger tests to CI/CD pipeline
- ✅ Test trial signup in staging before production

### 3. Monitoring
- ✅ Health check endpoint monitors trigger status
- ✅ Audit log captures template seeding failures
- ✅ Edge function logs include PostgreSQL error codes

### 4. Documentation
- ✅ Comment trigger functions with purpose and fix history
- ✅ Document column naming conventions
- ✅ Maintain rollback procedures

---

## Lessons Learned

1. **Database triggers should be defensive:** Always include error handling to prevent blocking critical operations

2. **Column naming matters:** Descriptive names (`tenant_id`) are better than generic ones (`id`) to avoid confusion

3. **Non-blocking design:** Template seeding is a nice-to-have, not a requirement for tenant creation

4. **Comprehensive logging:** PostgreSQL error codes (`42703`) helped quickly identify the issue

5. **Automated testing:** Trigger validation tests prevent regressions

---

## Related Files

- **Edge Functions:**
  - `supabase/functions/trial-signup/index.ts` - Main signup flow
  - `supabase/functions/health-check/index.ts` - System health monitoring

- **Database:**
  - `auto_seed_tenant_templates()` - Trigger function (fixed)
  - `seed_tenant_sms_templates()` - Template seeding function

- **Tests:**
  - `supabase/tests/trigger-validation.sql` - Automated validation

- **Frontend:**
  - `src/hooks/useTrialStatus.ts` - Trial signup hook with retry logic
  - `src/pages/SignUp.tsx` - Signup page with error handling

---

## Support

If you encounter issues related to this fix:

1. Check edge function logs: [trial-signup logs](https://supabase.com/dashboard/project/dxisnnjsbuuiunjmzzqj/functions/trial-signup/logs)
2. Run health check: `await supabase.functions.invoke('health-check')`
3. Check audit log for `TEMPLATE_SEED_FAILED` entries
4. Run trigger validation tests
5. Review this document's rollback plan

---

**Status:** All 6 phases complete ✅  
**Next Actions:** Monitor trial signups for 24 hours, then close incident
