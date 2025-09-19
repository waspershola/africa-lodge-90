# Critical Fixes - Prioritized Implementation Plan

## 🚨 **BLOCKERS (Fix Immediately)**

### **1. Consolidate Authentication System**
**Priority**: P0 - CRITICAL  
**Impact**: Prevents auth conflicts and security issues  
**Time**: 4-6 hours  

**Problem**: Two conflicting auth hooks causing inconsistent behavior
- `src/hooks/useAuth.ts` (legacy, POS-focused) 
- `src/hooks/useMultiTenantAuth.ts` (current, multi-tenant)

**Solution**: 
```typescript
// Keep src/hooks/useMultiTenantAuth.ts as single source of truth
// Update all components to import from MultiTenantAuthProvider
// Delete src/hooks/useAuth.ts
```

**Files to Update**:
- `src/components/pos/MenuEditorPOS.tsx` 
- `src/components/pos/PaymentDrawer.tsx`
- `src/components/pos/PosLiveFeed.tsx` 
- `src/components/pos/RoleGuard.tsx`
- `src/pages/pos/Approvals.tsx`

**Code Changes**:
```diff
- import { useAuth } from '@/hooks/useAuth';
+ import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
```

### **2. Fix Insecure Token Storage**  
**Priority**: P0 - SECURITY CRITICAL  
**Impact**: XSS vulnerability, token theft risk  
**Time**: 2-3 hours

**Problem**: Sensitive data stored in localStorage
```typescript
// VULNERABLE - Current implementation
localStorage.setItem('current_user_id', mockUser.id);
localStorage.setItem('hasActiveTrial', 'true');
```

**Solution**: Use Supabase Auth session management
```typescript
// SECURE - Supabase handles httpOnly cookies
const { data: { session } } = await supabase.auth.getSession();
```

**Files to Fix**:
- `src/hooks/useMultiTenantAuth.ts` (lines 177, 204)
- `src/hooks/useTrialStatus.ts` (lines 64, 103, 138)
- `src/hooks/useOnboarding.ts` (lines 52, 70, 118)

### **3. Enable Supabase Integration**
**Priority**: P0 - DEPLOYMENT BLOCKER  
**Impact**: Cannot deploy without real backend  
**Time**: 1 hour setup + validation

**Action Required**:
1. Click green "Supabase" button in Lovable interface
2. Connect to existing Supabase project (`cwamveqcwccpaiwrzifk`) 
3. Validate connection and run initial migrations

## 🔥 **HIGH PRIORITY (Fix This Week)**

### **4. Replace Mock Data with Supabase Queries**
**Priority**: P1 - HIGH  
**Impact**: Real data operations required for production  
**Time**: 8-12 hours

**Affected Hooks** (Priority Order):
1. `src/hooks/useMultiTenantAuth.ts` - User/tenant loading
2. `src/hooks/useOnboarding.ts` - Setup progress  
3. `src/hooks/useCheckout.ts` - Billing operations
4. `src/hooks/useConfiguration.ts` - Hotel settings
5. `src/hooks/useHousekeepingApi.ts` - Task management
6. `src/hooks/useMaintenanceApi.ts` - Work orders

**Pattern to Follow**:
```typescript
// Replace this mock pattern:
const mockData = [...];
setData(mockData);

// With Supabase queries:  
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('tenant_id', tenant?.tenant_id);
```

### **5. Implement Row Level Security (RLS)**
**Priority**: P1 - SECURITY  
**Impact**: Tenant isolation required  
**Time**: 4-6 hours

**Required Policies** (per table):
- `SELECT` policy: `tenant_id = auth.jwt() ->> 'tenant_id' OR auth.jwt() ->> 'role' = 'SUPER_ADMIN'`
- `INSERT/UPDATE/DELETE`: Similar tenant-scoped policies

**Tables Requiring RLS**:
- `tenants`, `users`, `rooms`, `reservations`, `folios`, `payments`
- `qr_codes`, `qr_orders`, `work_orders`, `audit_log`

## ⚠️ **MEDIUM PRIORITY (Fix Next Week)**

### **6. Implement Real-time Subscriptions** 
**Priority**: P2 - FEATURE  
**Impact**: Live updates for staff dashboards  
**Time**: 6-8 hours

**Required Channels**:
- `hotel_{tenant_id}_qr_orders` - QR service requests
- `hotel_{tenant_id}_pos_orders` - Kitchen orders  
- `hotel_{tenant_id}_housekeeping` - Task updates
- `hotel_{tenant_id}_maintenance` - Work order updates

### **7. Setup Payment Webhook Security**
**Priority**: P2 - PAYMENTS  
**Impact**: Payment processing integrity  
**Time**: 3-4 hours  

**Required**: HMAC signature verification for Paystack/Stripe webhooks

### **8. Implement Offline Sync Infrastructure**
**Priority**: P2 - RELIABILITY  
**Impact**: Offline capability for staff  
**Time**: 8-12 hours

**Components**: IndexedDB queue + sync reconciliation endpoints

## 🔧 **LOW PRIORITY (Fix Later)**

### **9. Performance Optimizations**
- Implement React.memo for heavy components
- Add virtual scrolling for large lists  
- Optimize bundle size with code splitting

### **10. Enhanced Error Handling** 
- Global error boundary implementation
- Structured logging with correlation IDs
- User-friendly error messages

### **11. Accessibility Improvements**
- ARIA labels for interactive elements
- Keyboard navigation support  
- Screen reader compatibility

## ✅ **Definition of Done**

Each fix is complete when:
- [ ] Code changes implemented and tested
- [ ] No console errors or warnings
- [ ] TypeScript types updated
- [ ] Security review passed (for security fixes)
- [ ] Integration tests passing (for backend fixes)
- [ ] Documentation updated

## 🚀 **Implementation Sequence**

**Week 1**: Blockers 1-3 (Auth consolidation + Supabase setup)  
**Week 2**: High Priority 4-5 (Data layer + Security)  
**Week 3**: Medium Priority 6-8 (Real-time + Payments + Offline)  
**Week 4**: Low Priority 9-11 (Polish + Performance)

---
**Note**: All fixes assume Supabase integration is enabled first. Do not proceed with data layer changes until Supabase connection is established.
