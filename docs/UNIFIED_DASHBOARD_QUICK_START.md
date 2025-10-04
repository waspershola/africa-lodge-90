# Unified Dashboard - Quick Start Guide

## 🚀 Getting Started

The new unified dashboard system provides a single, scalable architecture for all staff roles while maintaining backward compatibility with existing routes.

---

## 📍 Route Structure

### **New Unified Routes** (Recommended)
```
/staff-dashboard/:module
```

**Examples**:
- `/staff-dashboard/dashboard` - Main dashboard
- `/staff-dashboard/rooms` - Rooms management
- `/staff-dashboard/reservations` - Reservations
- `/staff-dashboard/billing` - Billing & payments

### **Legacy Routes** (Still Active)
```
/owner-dashboard/:module
/manager-dashboard/:module
/housekeeping-dashboard/:module
/maintenance-dashboard/:module
/pos/:module
```

**Note**: These will be deprecated in future releases. Start using unified routes for new development.

---

## 🛠️ Adding a New Module

### Step 1: Update Dashboard Config
**File**: `src/config/dashboardConfig.ts`

```typescript
export const DASHBOARD_CONFIG: Record<UserRole, RoleDashboardConfig> = {
  OWNER: {
    // ... existing config
    navigation: [
      // ... existing items
      { 
        name: 'Analytics',              // Display name
        href: '/owner-dashboard/analytics',  // Route path
        icon: BarChart3,                // Lucide icon
        module: 'analytics',            // Module identifier
        permission: 'analytics.read'    // Optional permission
      }
    ]
  }
};
```

### Step 2: Register Module in Manifest
**File**: `src/config/moduleManifest.ts`

```typescript
const ownerModules: Record<string, ModuleDefinition> = {
  // ... existing modules
  'analytics': {
    component: () => import('@/pages/owner/Analytics'),
    metadata: { 
      title: 'Analytics Dashboard',
      description: 'View business analytics and insights',
      requiredRole: ['OWNER' as UserRole]
    }
  }
};
```

### Step 3: Create the Page Component
**File**: `src/pages/owner/Analytics.tsx`

```typescript
import { Card } from '@/components/ui/card';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          View business analytics and insights
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          {/* Your content here */}
        </Card>
      </div>
    </div>
  );
}
```

**That's it!** The module is now accessible at `/staff-dashboard/analytics` for users with the OWNER role.

---

## 🎯 Role-Based Navigation

### Available Roles
```typescript
type UserRole = 
  | 'OWNER'        // Full hotel access
  | 'MANAGER'      // Operations management
  | 'HOUSEKEEPING' // Housekeeping operations
  | 'MAINTENANCE'  // Maintenance tasks
  | 'POS'          // Restaurant/Bar POS
  | 'FRONT_DESK'   // Front desk (separate route)
  | 'SUPER_ADMIN'  // Platform admin (separate route)
```

### Access Control
```typescript
// Single role requirement
<TenantAwareLayout requiredRole="OWNER">
  <DynamicDashboardShell />
</TenantAwareLayout>

// Multiple roles allowed
<TenantAwareLayout allowedRoles={['OWNER', 'MANAGER', 'FRONT_DESK']}>
  <Content />
</TenantAwareLayout>
```

---

## 🔧 Utility Functions

### Get Dashboard Config
```typescript
import { getDashboardConfig } from '@/config/dashboardConfig';

const config = getDashboardConfig('OWNER');
console.log(config?.navigation); // Array of nav items
```

### Get Module Definition
```typescript
import { getModuleDefinition } from '@/config/moduleManifest';

const module = getModuleDefinition('OWNER', 'dashboard');
console.log(module?.metadata.title); // "Dashboard"
```

### Check Module Access
```typescript
import { hasModuleAccess } from '@/utils/roleRouter';

const canAccess = hasModuleAccess('MANAGER', 'billing');
// false - managers don't have billing access
```

### Convert Legacy Routes
```typescript
import { convertLegacyRoute } from '@/utils/roleRouter';

const newRoute = convertLegacyRoute('/owner-dashboard/rooms');
// Returns: "/staff-dashboard/rooms"
```

---

## 🎨 Using Icons

### Import from Lucide React
```typescript
import { 
  Home, 
  Calendar, 
  Users, 
  Settings 
} from 'lucide-react';

// Use in navigation config
{
  name: 'Dashboard',
  href: '/staff-dashboard/dashboard',
  icon: Home,  // Pass the component, not JSX
  module: 'dashboard'
}
```

### Available Icons
See full list at: [https://lucide.dev/icons](https://lucide.dev/icons)

---

## 🧪 Testing the New System

### Test Unified Dashboard
```bash
# Navigate to unified route
http://localhost:8080/staff-dashboard/dashboard

# Test different modules
http://localhost:8080/staff-dashboard/rooms
http://localhost:8080/staff-dashboard/reservations
```

### Test Role Switching
```typescript
// In browser console
localStorage.setItem('user_role', 'MANAGER');
window.location.reload();
```

### Test Legacy Redirect
```bash
# Add ?useUnified=true to any legacy route
http://localhost:8080/owner-dashboard/rooms?useUnified=true
```

---

## 🚦 Migration Strategy

### Phase 1: Parallel Operation (Current)
- Both legacy and unified routes work
- New features use unified routes
- Existing features remain on legacy routes

### Phase 2: Gradual Migration
- Move high-traffic modules to unified routes
- Add migration banners to legacy routes
- Monitor for issues

### Phase 3: Deprecation
- Mark legacy routes as deprecated
- Show warnings on legacy routes
- Update all internal links

### Phase 4: Cleanup
- Remove legacy routes
- Delete old layout files
- Final testing and documentation

---

## 🔍 Debugging

### Enable Debug Mode
```typescript
// In browser console
localStorage.setItem('debug', 'true');
```

### Check Current Route
```typescript
import { useLocation } from 'react-router-dom';

function MyComponent() {
  const location = useLocation();
  console.log('Current path:', location.pathname);
}
```

### Verify Module Loading
```typescript
import { moduleExists } from '@/config/moduleManifest';

const exists = moduleExists('OWNER', 'dashboard');
console.log('Module exists:', exists);
```

---

## 📚 Best Practices

### ✅ DO:
- Use unified routes for all new features
- Keep modules small and focused
- Use semantic naming for modules
- Add proper TypeScript types
- Test across different roles
- Use lazy loading for all modules

### ❌ DON'T:
- Create new legacy routes
- Hardcode navigation in components
- Skip role validation
- Duplicate module logic
- Mix old and new routing patterns
- Import modules directly (use manifest)

---

## 🆘 Common Issues

### Issue: Module Not Found
**Cause**: Module not registered in manifest  
**Fix**: Add module to `moduleManifest.ts`

### Issue: Access Denied
**Cause**: User role not in `requiredRole` array  
**Fix**: Update module metadata with correct roles

### Issue: Icon Not Displaying
**Cause**: Icon imported incorrectly  
**Fix**: Import icon component, not icon name string

### Issue: Route Not Working
**Cause**: Module name mismatch between config and manifest  
**Fix**: Ensure module identifiers match exactly

---

## 📞 Support

**Questions?** Check the full implementation guide:
- `UNIFIED_DASHBOARD_IMPLEMENTATION_STATUS.md`

**Found a bug?** Report it with:
- Current route
- User role
- Expected vs actual behavior
- Browser console errors

---

**Last Updated**: 2025-01-19  
**Version**: 1.0.0
