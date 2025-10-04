# 🧪 Testing Guide - Unified Dashboard Implementation

**Version:** 2.0  
**Last Updated:** 2025-01-19

---

## 🎯 Quick Test Path

### **1. Access the Debug Tool** (30 seconds)
```
Navigate to: /debug/menu-preview
```

**What to verify:**
- ✅ Page loads without errors
- ✅ 6 role badges visible (OWNER, MANAGER, ACCOUNTANT, HOUSEKEEPING, MAINTENANCE, POS)
- ✅ Configuration validation shows "All configurations are valid"

---

### **2. Test Role Switching** (2 minutes)

#### **Test ACCOUNTANT Role**
1. Click "ACCOUNTANT" badge
2. Verify "Modules (4)" tab shows:
   - Dashboard
   - Payment Logs
   - Financial Reports
   - Payroll
3. Check "Statistics" tab:
   - Total Modules: 4
   - Direct Modules: 4
   - Inherited Modules: 0

#### **Test MANAGER Role**
1. Click "MANAGER" badge
2. Verify "Modules (16)" tab shows:
   - 4 direct modules (Manager Overview, Operations, Approvals, Staff Management)
   - Plus inherited modules from ACCOUNTANT, HOUSEKEEPING, POS
3. Check "Statistics" tab:
   - Total Modules: 16
   - Direct Modules: 4
   - Inherited Modules: 12

#### **Test OWNER Role**
1. Click "OWNER" badge
2. Verify "Modules (23+)" tab shows:
   - All MANAGER modules
   - All department modules
   - Owner-specific modules (QR Manager, Financials, etc.)
3. Check "Inheritance Tree" tab:
   - Should show nested structure
   - OWNER → MANAGER → [ACCOUNTANT, HOUSEKEEPING, POS]

---

### **3. Verify Validation Matrix** (1 minute)

Navigate to: Debug Tool → Statistics Tab → Validation Matrix

**Expected Results:**

| Role | Direct | Inherited | Total |
|------|--------|-----------|-------|
| HOUSEKEEPING | 5 | 0 | 5 |
| MAINTENANCE | 4 | 0 | 4 |
| POS | 4 | 0 | 4 |
| ACCOUNTANT | 4 | 0 | 4 |
| MANAGER | 4 | 12 | 16 |
| OWNER | 6 | 17+ | 23+ |

✅ All numbers should match
✅ No "NaN" or "undefined" values

---

## 🔍 Deep Testing

### **4. Test ACCOUNTANT Pages** (5 minutes)

#### **Access Methods:**
1. **Via TypeScript Config (Legacy):**
   ```
   /accountant-dashboard/dashboard
   /accountant-dashboard/payments
   /accountant-dashboard/reports
   /accountant-dashboard/payroll
   ```

2. **Via Unified Route (New):**
   ```
   /staff-dashboard/dashboard (as ACCOUNTANT)
   /staff-dashboard/payments
   /staff-dashboard/reports
   /staff-dashboard/payroll
   ```

#### **What to verify:**
- ✅ Dashboard shows financial KPIs
- ✅ Payments page has transaction table
- ✅ Reports page has report generation options
- ✅ Payroll page shows employee list
- ✅ All pages render without console errors

---

### **5. Test Role Inheritance** (5 minutes)

#### **Login as MANAGER**
Expected access to:
- ✅ Own modules (4)
- ✅ ACCOUNTANT modules (4)
- ✅ HOUSEKEEPING modules (5)
- ✅ POS modules (4)
- ❌ OWNER-exclusive modules (should NOT have access)

#### **Login as OWNER**
Expected access to:
- ✅ Own modules (6)
- ✅ All MANAGER modules (16)
- ✅ All department modules
- ✅ Total: 23+ unique modules

#### **Test Navigation:**
1. Open sidebar
2. Count visible menu items
3. Click each item
4. Verify correct page loads

---

### **6. Test JSON Config (Optional)** (10 minutes)

#### **Enable JSON Mode:**
Edit `src/App.tsx`:
```tsx
<DynamicDashboardShell useJsonConfig={true} />
```

#### **What to verify:**
- ✅ Sidebar still renders
- ✅ All modules visible
- ✅ Icons load correctly
- ✅ Navigation works
- ✅ Inheritance still functions

#### **Test Hot Config Updates:**
1. Edit `src/config/menuConfig.json`
2. Add a test module to ACCOUNTANT
3. Save file
4. Refresh browser
5. Check if new module appears in debug tool

---

## 🐛 Troubleshooting Tests

### **Test 1: Configuration Validation**
```typescript
import { validateMenuConfig } from '@/hooks/useMenuLoader';

const result = validateMenuConfig();
console.log('Valid:', result.valid);
console.log('Errors:', result.errors);
```

Expected: `valid: true`, `errors: []`

---

### **Test 2: Module Resolution**
```typescript
import { useMenuLoader } from '@/hooks/useMenuLoader';

const { modules } = useMenuLoader('MANAGER');
console.log('Manager modules:', modules.length); // Should be 16
```

---

### **Test 3: Inheritance Tree**
```typescript
import { useMenuInheritance } from '@/hooks/useMenuInheritance';

const { inheritanceTree } = useMenuInheritance('OWNER');
console.log(JSON.stringify(inheritanceTree, null, 2));
```

Expected: Nested structure showing OWNER → MANAGER → departments

---

## ⚠️ Known Issues to Test For

### **Issue 1: Icon Not Found**
**Symptom:** Circle icon appears instead of specified icon  
**Cause:** Icon name in JSON doesn't match Lucide React export  
**Fix:** Check icon name in `menuConfig.json` matches Lucide docs

---

### **Issue 2: Module Not Loading**
**Symptom:** "Module Not Found" error  
**Cause:** Component path in JSON is incorrect  
**Fix:** Verify component exists at specified path

---

### **Issue 3: Circular Dependency**
**Symptom:** Validation shows circular dependency error  
**Cause:** Role A inherits from Role B which inherits from Role A  
**Fix:** Edit `menuConfig.json` to break the cycle

---

## ✅ Acceptance Criteria

### **Must Pass:**
- [ ] Debug tool loads without errors
- [ ] All 6 roles show correct module counts
- [ ] Validation reports no errors
- [ ] ACCOUNTANT has 4 modules
- [ ] MANAGER has 16 modules (4 direct + 12 inherited)
- [ ] OWNER has 23+ modules
- [ ] No console errors in browser
- [ ] All navigation links work
- [ ] Sidebar opens/closes correctly
- [ ] Active route highlights properly

### **Should Pass:**
- [ ] JSON config mode works when enabled
- [ ] Icons render correctly for all modules
- [ ] Pages load quickly (<1 second)
- [ ] No memory leaks during navigation
- [ ] Responsive design works on mobile

### **Nice to Have:**
- [ ] Smooth animations
- [ ] Keyboard navigation works
- [ ] Search functionality (future)
- [ ] Module favorites (future)

---

## 📊 Performance Benchmarks

### **Target Metrics:**
- Module resolution: <5ms
- Page load: <1s
- Navigation switch: <200ms
- Debug tool render: <500ms

### **How to Measure:**
```javascript
console.time('module-resolution');
const { modules } = useMenuLoader('OWNER');
console.timeEnd('module-resolution');
// Should log: module-resolution: 2-4ms
```

---

## 🚨 Regression Tests

### **Test Existing Functionality:**
- [ ] Owner dashboard still works
- [ ] Manager dashboard still works
- [ ] Housekeeping dashboard still works
- [ ] Maintenance dashboard still works
- [ ] POS dashboard still works
- [ ] Front desk not affected
- [ ] Super admin not affected
- [ ] Legacy routes still work

---

## 📝 Test Report Template

```markdown
## Test Session Report

**Date:** _______
**Tester:** _______
**Environment:** Production/Staging/Dev

### Results:
- [ ] Quick Test Path: PASS / FAIL
- [ ] Deep Testing: PASS / FAIL
- [ ] Troubleshooting: PASS / FAIL
- [ ] Acceptance Criteria: __/10 passed

### Issues Found:
1. _______
2. _______

### Screenshots:
_______

### Notes:
_______
```

---

## 🎓 Testing Tips

1. **Use Browser DevTools**
   - Check console for errors
   - Monitor network requests
   - Inspect React components

2. **Test with Real Data**
   - Use actual user accounts
   - Test with production-like data
   - Verify permissions work

3. **Test Edge Cases**
   - User with no role
   - User with invalid role
   - Empty tenant data
   - Slow network conditions

4. **Document Everything**
   - Screenshot any issues
   - Record console errors
   - Note reproduction steps

---

## 🏁 Final Checklist

Before marking as "Production Ready":
- [ ] All acceptance criteria met
- [ ] No critical bugs found
- [ ] Performance benchmarks met
- [ ] Regression tests passed
- [ ] Documentation reviewed
- [ ] Stakeholder approval obtained

---

**Happy Testing! 🎉**

For issues or questions, refer to:
- `IMPLEMENTATION_COMPLETE.md` - Overview
- `UNIFIED_DASHBOARD_FULL_REPORT.md` - Technical details
- `docs/UNIFIED_DASHBOARD_QUICK_START.md` - Usage guide
