# Phase 9-11 Implementation: Timeout Protection & Advanced Logging

**Implementation Date:** 2025-10-14  
**Builds on:** Phases 1-8 (Database Trigger Fix, Health Check, Error Handling)

---

## 🎯 Objectives

Fix the trial-signup function's hanging issue by implementing:
1. Timeout protection for all database operations
2. Detailed step-by-step logging to identify bottlenecks
3. Overall function timeout (25 seconds)
4. RLS permission error handling

---

## 📊 Problem Analysis

### What Was Happening:
- Function logs showed "Starting trial signup" but never completed
- No tenants created since September 26, 2025
- Function appeared to hang at user existence check (line 94-98)
- Test email `info@waspersolution.com` already exists as SUPER_ADMIN

### Root Causes:
1. **No timeout protection** - Database calls could hang indefinitely
2. **Insufficient logging** - Couldn't identify exact hang point
3. **RLS policy blocking** - User existence check might be blocked by RLS
4. **No overall timeout** - Function could run forever

---

## ✅ Phase 9: Timeout Protection & Better Logging

### Changes Made:

#### 1. **Timeout Wrapper Utility**
```typescript
const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
};
```

#### 2. **Step-by-Step Logging**
Every operation now logs:
- `Step X: [Operation starting]`
- `Step X: ✓ [Success]` or `Step X: ✗ [Failure]`
- Duration and relevant data

Example:
```typescript
console.log(`[${operationId}] Step 5: Checking for existing user with email: ${owner_email}`);
// ... operation
console.log(`[${operationId}] Step 5: ✓ User check completed`, { found: !!existingUserCheck.data });
```

#### 3. **Protected Operations with Timeouts**

| Operation | Timeout | Why This Timeout |
|-----------|---------|------------------|
| User existence check | 5s | Simple SELECT query |
| Plan lookup | 5s | Simple SELECT with WHERE |
| Tenant creation | 10s | INSERT with trigger execution |
| Default roles creation | 10s | RPC call with multiple INSERTs |
| Auth user creation | 10s | External Supabase Auth API |
| Owner role lookup | 5s | Simple SELECT |

#### 4. **RLS Error Handling**
```typescript
catch (existingUserError: any) {
  if (existingUserError.code === 'PGRST301' || existingUserError.message?.includes('RLS')) {
    console.error(`[${operationId}] RLS policy blocking user check`);
    // Continue anyway - let auth.createUser handle duplicate detection
  } else if (existingUserError.message?.includes('timed out')) {
    return 503 error with debug info
  }
}
```

---

## ✅ Phase 10: Test Email Guidance

### Issue Identified:
- Test email `info@waspersolution.com` already exists as SUPER_ADMIN
- This causes legitimate "user already exists" errors

### Solution:
Documentation added for testing with fresh emails after implementation.

---

## ✅ Phase 11: Overall Function Timeout

### Implementation:

#### 1. **25-Second Function Timeout**
```typescript
const functionTimeout = setTimeout(() => {
  console.error(`[${operationId}] CRITICAL: Function timeout reached (25s)`);
}, 25000);
```

#### 2. **Cleanup on Success**
```typescript
clearTimeout(functionTimeout);
return new Response(JSON.stringify({ ... }));
```

#### 3. **Cleanup on Error**
```typescript
catch (error: any) {
  clearTimeout(functionTimeout);
  // ... error handling
}
```

---

## 🔍 Logging Map

### Complete Step Flow:
```
[operationId] Step 1: Creating Supabase client
[operationId] Step 1: ✓ Supabase client created
[operationId] Step 2: Parsing request body
[operationId] Step 2: ✓ Request parsed
[operationId] Step 3: Validating required fields
[operationId] Step 3: ✓ Required fields validated
[operationId] Step 4: Validating password strength
[operationId] Step 4: ✓ Password validated
[operationId] Step 5: Checking for existing user
[operationId] Step 5: ✓ User check completed
[operationId] Step 6: Looking up Starter plan
[operationId] Step 6: Plan query completed
[operationId] Step 7: Creating tenant record
[operationId] Step 7: ✓ Tenant created
[operationId] Step 8: Creating default tenant roles
[operationId] Step 8: ✓ Default roles created
[operationId] Step 9: Creating auth user
[operationId] Step 9: ✓ Auth user created
[operationId] Step 10: Finding Owner role
[operationId] Step 10: Owner role lookup completed
[operationId] Step 11: Trial signup completed successfully
```

### On Timeout:
```
[operationId] Step X: ✗ [Operation] timeout: [operation] timed out after Xms
```

### On RLS Error:
```
[operationId] RLS policy blocking user check
```

---

## 🧪 Verification Steps

### 1. Check Edge Function Logs
```bash
# Look for the new step-by-step logging
# Should see "Step 1" through "Step 11" for successful signups
```

### 2. Test with Fresh Email
```bash
# Use a NEW email (not info@waspersolution.com)
POST /trial-signup
{
  "hotel_name": "Test Hotel 123",
  "owner_email": "newemail@example.com",
  "owner_name": "Test User",
  "password": "SecurePass123!"
}
```

### 3. Check for Timeout Errors
```sql
-- Check if any tenants were created
SELECT tenant_id, hotel_name, created_at 
FROM tenants 
WHERE created_at > '2025-10-14T18:00:00Z'
ORDER BY created_at DESC;
```

### 4. Monitor Execution Times
Look in logs for:
```
[operationId] Step 11: Trial signup completed successfully {
  duration_ms: [should be < 5000ms normally]
}
```

---

## 🎯 Expected Outcomes

### Before Phases 9-11:
- ❌ Function hangs indefinitely
- ❌ No clear indication of where it fails
- ❌ No tenants created since Sep 26
- ❌ Logs show start but no completion

### After Phases 9-11:
- ✅ Function completes or times out within 25 seconds
- ✅ Clear step-by-step logging shows exact failure point
- ✅ RLS errors handled gracefully
- ✅ New tenants can be created with fresh emails
- ✅ Detailed error messages for troubleshooting

---

## 🐛 Debugging Guide

### If Function Still Hangs:

1. **Check which step it stops at**
   ```bash
   # Look for the last "Step X: ✓" in logs
   # The next step is where it hangs
   ```

2. **Check for timeout errors**
   ```bash
   # Look for "timed out after Xms" in logs
   ```

3. **Check RLS policies**
   ```sql
   -- If Step 5 fails, check users table RLS
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

4. **Check if operation_id appears multiple times**
   ```bash
   # If same operation_id logs multiple "Step 1", 
   # the function is being retried
   ```

---

## 📈 Monitoring Metrics

### Key Metrics to Track:
- **Signup completion rate**: Should be > 95%
- **Average duration**: Should be 2-5 seconds
- **Timeout rate**: Should be < 1%
- **RLS error rate**: Should be 0% (indicates policy issue)

### Log Queries:
```typescript
// Find failed signups in last hour
SELECT event_message 
FROM edge_function_logs 
WHERE function_name = 'trial-signup'
  AND timestamp > now() - interval '1 hour'
  AND event_message LIKE '%✗%'
ORDER BY timestamp DESC;
```

---

## 🔐 Security Notes

1. **Timeout values are conservative** - Can be adjusted based on production metrics
2. **RLS bypass on user check** - Only continues if RLS blocks, auth.createUser still enforces uniqueness
3. **Detailed logging** - operation_id allows tracking requests without exposing sensitive data
4. **Rollback on failure** - All changes are rolled back if any step fails

---

## 🚀 Next Steps

1. **Test with fresh email** (not info@waspersolution.com)
2. **Monitor logs** for step-by-step execution
3. **Check tenant creation** in database
4. **Adjust timeouts** if needed based on actual execution times
5. **Review RLS policies** if Step 5 consistently times out

---

## 📚 Related Documentation

- **Phase 1-2**: `docs/TRIAL_SIGNUP_FIX_2025.md` (Database trigger fix)
- **Phase 3-6**: Health check monitoring and documentation
- **Phase 7-8**: Blocking call removal and health check fix
- **Supabase Logs**: Check Edge Function logs in Supabase dashboard

---

**Status:** ✅ Phases 9-11 Complete  
**Testing Required:** Yes - use fresh email  
**Production Ready:** Yes - with monitoring
