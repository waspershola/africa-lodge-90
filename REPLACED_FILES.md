# Replaced Files - Single Source of Truth Implementation

## 🔧 GOLD COMMAND Compliance - Duplicate Elimination

### Authentication System Consolidation

**KEEP**: `src/hooks/useMultiTenantAuth.ts` + `src/components/auth/MultiTenantAuthProvider.tsx`
- ✅ Complete multi-tenant implementation
- ✅ Proper JWT handling with tenant isolation  
- ✅ Role-based access control
- ✅ Trial status management

**REPLACE/DELETE**: `src/hooks/useAuth.ts`
- ❌ Legacy POS-only auth system
- ❌ Conflicting user role definitions
- ❌ Missing tenant context
- **Reason**: Causes auth conflicts and security inconsistencies

**Files Requiring Updates**:
```typescript
// These files must be updated to use MultiTenantAuthProvider:
- src/components/pos/MenuEditorPOS.tsx (line 28)
- src/components/pos/PaymentDrawer.tsx (line 20)  
- src/components/pos/PosLiveFeed.tsx (line 27)
- src/components/pos/RoleGuard.tsx (line 6)
- src/pages/pos/Approvals.tsx (line 6)

// Change from:
import { useAuth } from '@/hooks/useAuth';

// To:
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
```

### Layout System Unification

**KEEP**: `src/components/layout/UnifiedDashboardLayout.tsx`
- ✅ Consistent sidebar implementation
- ✅ Mobile-responsive design
- ✅ Role-based navigation
- ✅ Breadcrumb support

**CONSOLIDATE**: Individual layout files use UnifiedDashboardLayout as base
- `src/components/layout/HousekeepingLayout.tsx` ✅ (Already uses UnifiedDashboardLayout)
- `src/components/layout/MaintenanceLayout.tsx` ✅ (Already uses UnifiedDashboardLayout)
- `src/components/layout/ManagerLayout.tsx` ✅ (Uses UnifiedDashboardLayout)
- `src/components/layout/POSLayout.tsx` ✅ (Uses UnifiedDashboardLayout)
- `src/components/layout/SuperAdminLayout.tsx` ✅ (Uses UnifiedDashboardLayout)

**INCONSISTENT**: `src/components/layout/OwnerLayout.tsx`
- ❌ Custom sidebar implementation in `src/components/OwnerDashboard.tsx`
- **Action Required**: Refactor OwnerDashboard to use UnifiedDashboardLayout pattern

### Data Access Layer Standardization

**KEEP**: Supabase client pattern (when implemented)
```typescript
// Standard pattern for all data operations:
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('tenant_id', tenant.tenant_id);
```

**REPLACE**: Mock data adapters and localStorage persistence
- ❌ `src/lib/api/mockAdapter.ts` - Remove after Supabase integration
- ❌ All `localStorage` usage for business data
- ❌ Mock user/tenant arrays in hooks
- **Reason**: No real data persistence or security

### Theme Provider Simplification  

**CURRENT STATE**: Single theme provider ✅
- `src/App.tsx` correctly wraps app in providers
- No duplicate theme providers found
- Consistent design system usage

### Route Definition Centralization

**CURRENT STATE**: Routes properly centralized ✅  
- `src/App.tsx` contains all route definitions
- No duplicate routing found
- Proper role-based route protection via `TenantAwareLayout`

## 📋 Action Items for Consolidation

### 1. Delete Legacy Auth Hook
```bash
# Remove conflicting auth implementation
rm src/hooks/useAuth.ts
```

### 2. Update POS Components (5 files)
```typescript  
// Global find-and-replace operation needed:
// Find: import { useAuth } from '@/hooks/useAuth';
// Replace: import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

// Files to update:
- src/components/pos/MenuEditorPOS.tsx
- src/components/pos/PaymentDrawer.tsx  
- src/components/pos/PosLiveFeed.tsx
- src/components/pos/RoleGuard.tsx
- src/pages/pos/Approvals.tsx
```

### 3. Refactor OwnerDashboard Layout
```typescript
// Convert src/components/OwnerDashboard.tsx to use UnifiedDashboardLayout
// Extract sidebar items to navigation config
// Remove custom sidebar implementation
```

### 4. Remove Mock Adapters (Post-Supabase Integration)
```bash
# After Supabase integration is complete:
rm src/lib/api/mockAdapter.ts

# Update all hooks to use Supabase client instead of mock data:
- src/hooks/useMultiTenantAuth.ts (remove mockUsers, mockTenants)
- src/hooks/useHousekeepingApi.ts (remove localStorage calls)  
- src/hooks/useMaintenanceApi.ts (remove mock arrays)
- src/hooks/usePOSApi.ts (remove mock data)
- src/hooks/useCheckout.ts (remove mock checkout flow)
```

## 🎯 Post-Consolidation Benefits

### Security Improvements
- Single authentication source prevents token conflicts
- Consistent tenant isolation across all components
- Centralized JWT handling with proper security

### Maintainability Gains  
- Single sidebar component to maintain
- Unified data access patterns
- Consistent error handling and loading states

### Performance Benefits
- Reduced bundle size (eliminate duplicate code)
- Consistent caching strategies  
- Optimized re-renders with single auth context

## ✅ Verification Checklist

- [ ] All POS components import from MultiTenantAuthProvider
- [ ] src/hooks/useAuth.ts deleted  
- [ ] No compilation errors after auth consolidation
- [ ] All layouts use UnifiedDashboardLayout pattern
- [ ] Mock data removed after Supabase integration
- [ ] No localStorage usage for business data
- [ ] Single source of truth for all major systems

## 🚨 Critical Dependencies

**Must complete BEFORE Supabase integration**:
1. Auth system consolidation (prevents JWT conflicts)
2. Remove localStorage auth tokens (security issue)

**Must complete DURING Supabase integration**:
1. Replace all mock data with real queries
2. Test tenant isolation with RLS policies

**Must complete AFTER Supabase integration**:
1. Remove mock adapter files
2. Verify no duplicate data sources remain

---
**Result**: Single source of truth established for authentication, layouts, data access, and theme management across the entire codebase.