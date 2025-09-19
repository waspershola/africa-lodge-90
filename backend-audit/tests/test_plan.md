# Comprehensive Test Plan

## Test Strategy Overview

### Testing Pyramid
1. **Unit Tests (60%)** - Business logic and utilities
2. **Integration Tests (30%)** - API endpoints and database operations  
3. **E2E Tests (10%)** - Critical user workflows

### Test Environment Setup
- **Development**: Local Supabase with test data
- **Staging**: Dedicated Supabase project with production-like data
- **Production**: Synthetic monitoring and smoke tests

## Unit Tests

### 1. Business Logic Tests
```typescript
// tests/unit/billing.test.ts
describe('Folio Calculations', () => {
  test('should calculate correct balance with charges and payments', () => {
    const folio = new Folio();
    folio.addCharge({ amount: 5000, description: 'Room charge' });
    folio.addCharge({ amount: 1500, description: 'Service charge' });
    folio.addPayment({ amount: 3000, method: 'cash' });
    
    expect(folio.getBalance()).toBe(3500);
  });

  test('should handle multiple currencies correctly', () => {
    const folio = new Folio({ currency: 'USD' });
    folio.addCharge({ amount: 100, description: 'Room' });
    
    expect(folio.getFormattedBalance()).toBe('$100.00');
  });

  test('should prevent negative payments', () => {
    const folio = new Folio();
    
    expect(() => {
      folio.addPayment({ amount: -100, method: 'cash' });
    }).toThrow('Payment amount cannot be negative');
  });
});
```

### 2. Utility Function Tests
```typescript
// tests/unit/utils.test.ts  
describe('QR Token Generation', () => {
  test('should generate secure QR tokens', () => {
    const token = generateQRToken('room-101', '24h');
    
    expect(token).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 format
    expect(token.length).toBeGreaterThan(20);
  });

  test('should include expiry in token payload', () => {
    const token = generateQRToken('room-101', '24h');
    const decoded = decodeQRToken(token);
    
    expect(decoded.room_id).toBe('room-101');
    expect(decoded.expires_at).toBeDefined();
  });
});

describe('Tenant Isolation Helpers', () => {
  test('should validate tenant access correctly', () => {
    const user = { tenant_id: 'tenant-1', role: 'MANAGER' };
    const resource = { tenant_id: 'tenant-1' };
    
    expect(canAccessResource(user, resource)).toBe(true);
  });

  test('should deny cross-tenant access', () => {
    const user = { tenant_id: 'tenant-1', role: 'MANAGER' };
    const resource = { tenant_id: 'tenant-2' };
    
    expect(canAccessResource(user, resource)).toBe(false);
  });

  test('should allow super admin global access', () => {
    const user = { tenant_id: null, role: 'SUPER_ADMIN' };
    const resource = { tenant_id: 'tenant-1' };
    
    expect(canAccessResource(user, resource)).toBe(true);
  });
});
```

### 3. Conflict Resolution Tests
```typescript
// tests/unit/offline-sync.test.ts
describe('Conflict Resolution', () => {
  test('should resolve folio charge conflicts additively', () => {
    const serverCharges = [
      { id: '1', amount: 1000, idempotency_key: 'charge-1' }
    ];
    const clientCharges = [
      { id: '2', amount: 500, idempotency_key: 'charge-2' },
      { id: '3', amount: 1000, idempotency_key: 'charge-1' } // Duplicate
    ];

    const resolved = resolveFolioCharges(serverCharges, clientCharges);
    
    expect(resolved).toHaveLength(2);
    expect(resolved.find(c => c.idempotency_key === 'charge-1')).toBeDefined();
    expect(resolved.find(c => c.idempotency_key === 'charge-2')).toBeDefined();
  });

  test('should apply server-wins for room status conflicts', () => {
    const conflict = {
      server_data: { status: 'maintenance', updated_at: '2024-01-02T10:00:00Z' },
      client_data: { status: 'available', updated_at: '2024-01-02T09:00:00Z' }
    };

    const resolved = resolveRoomStatusConflict(conflict);
    
    expect(resolved.final_data.status).toBe('maintenance');
    expect(resolved.resolution).toBe('server_wins');
  });
});
```

## Integration Tests

### 1. Authentication Flow Tests
```typescript
// tests/integration/auth.test.ts
describe('Authentication API', () => {
  test('should authenticate valid credentials', async () => {
    const response = await request(app)
      .post('/auth/v1/token')
      .send({
        email: 'owner@testhotel.com',
        password: 'test_password_123'
      });

    expect(response.status).toBe(200);
    expect(response.body.access_token).toBeDefined();
    expect(response.body.user.tenant_id).toBeDefined();
  });

  test('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/auth/v1/token')
      .send({
        email: 'owner@testhotel.com',
        password: 'wrong_password'
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Invalid credentials');
  });

  test('should enforce tenant isolation in token claims', async () => {
    const response = await request(app)
      .post('/auth/v1/token')
      .send({
        email: 'owner@testhotel.com',
        password: 'test_password_123'
      });

    const decoded = jwt.decode(response.body.access_token);
    expect(decoded.tenant_id).toBe('test-tenant-123');
    expect(decoded.role).toBe('OWNER');
  });
});
```

### 2. Room Management API Tests
```typescript
// tests/integration/rooms.test.ts
describe('Room Management API', () => {
  beforeEach(async () => {
    await setupTestDatabase();
    await createTestTenant();
  });

  test('should create room with proper tenant isolation', async () => {
    const response = await authenticatedRequest('OWNER')
      .post('/rest/v1/rooms')
      .send({
        room_number: '101',
        room_type_id: 'standard',
        floor: 1,
        status: 'available'
      });

    expect(response.status).toBe(201);
    expect(response.body.tenant_id).toBe(testTenantId);
  });

  test('should not allow cross-tenant room access', async () => {
    const otherTenantRoom = await createRoom({ tenant_id: 'other-tenant' });
    
    const response = await authenticatedRequest('OWNER')
      .get(`/rest/v1/rooms?id=eq.${otherTenantRoom.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0); // RLS should filter out
  });

  test('should update room status with audit trail', async () => {
    const room = await createRoom({ tenant_id: testTenantId });
    
    const response = await authenticatedRequest('FRONT_DESK')
      .patch(`/rest/v1/rooms?id=eq.${room.id}`)
      .send({ status: 'occupied', guest_id: 'guest-123' });

    expect(response.status).toBe(200);

    // Verify audit log entry
    const auditLog = await supabase
      .from('audit_log')
      .select('*')
      .eq('table_name', 'rooms')
      .eq('record_id', room.id)
      .single();

    expect(auditLog.data.action).toBe('UPDATE');
    expect(auditLog.data.changes).toContain('status');
  });
});
```

### 3. QR Service Integration Tests
```typescript
// tests/integration/qr-services.test.ts
describe('QR Service API', () => {
  test('should generate valid QR code for room', async () => {
    const room = await createRoom({ room_number: '101' });
    
    const response = await authenticatedRequest('MANAGER')
      .post('/rest/v1/qr_codes')
      .send({
        room_id: room.id,
        room_number: '101',
        services_enabled: ['housekeeping', 'room_service'],
        expires_at: '2024-12-31T23:59:59Z'
      });

    expect(response.status).toBe(201);
    expect(response.body.qr_token).toBeDefined();
    expect(response.body.qr_url).toContain(response.body.qr_token);
  });

  test('should validate QR token on scan', async () => {
    const qrCode = await createQRCode({ room_id: testRoomId });
    
    const response = await request(app)
      .get(`/rest/v1/qr_codes/${qrCode.qr_token}`);

    expect(response.status).toBe(200);
    expect(response.body.services_enabled).toEqual(['housekeeping', 'room_service']);
    expect(response.body.room_number).toBe('101');
  });

  test('should create service request from QR scan', async () => {
    const qrCode = await createQRCode({ room_id: testRoomId });
    
    const response = await request(app)
      .post(`/rest/v1/qr_codes/${qrCode.qr_token}/scan`)
      .send({
        service_type: 'housekeeping',
        request_details: {
          type: 'cleaning',
          priority: 'normal',
          notes: 'Please replace towels'
        },
        guest_session_id: 'guest_session_123'
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('pending');
    expect(response.body.qr_code_id).toBe(qrCode.id);
  });
});
```

### 4. Billing Integration Tests
```typescript
// tests/integration/billing.test.ts
describe('Billing API', () => {
  test('should create folio on room assignment', async () => {
    const room = await createRoom();
    
    const response = await authenticatedRequest('FRONT_DESK')
      .patch(`/rest/v1/rooms?id=eq.${room.id}`)
      .send({ 
        status: 'occupied', 
        guest_id: 'guest-123',
        guest_name: 'John Doe'
      });

    expect(response.status).toBe(200);

    // Verify folio creation
    const folio = await supabase
      .from('folios')
      .select('*')
      .eq('room_id', room.id)
      .eq('status', 'open')
      .single();

    expect(folio.data.guest_name).toBe('John Doe');
    expect(folio.data.balance).toBe(0);
  });

  test('should add charges to folio correctly', async () => {
    const folio = await createFolio({ guest_name: 'Test Guest' });
    
    const response = await authenticatedRequest('FRONT_DESK')
      .post('/rest/v1/folio_charges')
      .send({
        folio_id: folio.id,
        description: 'Room Service',
        amount: 2500.00,
        quantity: 1,
        unit_price: 2500.00
      });

    expect(response.status).toBe(201);

    // Verify folio balance update
    const updatedFolio = await supabase
      .from('folios')
      .select('balance')
      .eq('id', folio.id)
      .single();

    expect(updatedFolio.data.balance).toBe(2500.00);
  });

  test('should process payments and update balance', async () => {
    const folio = await createFolioWithCharges({ total_charges: 5000 });
    
    const response = await authenticatedRequest('FRONT_DESK')
      .post('/rest/v1/payments')
      .send({
        folio_id: folio.id,
        amount: 3000.00,
        payment_method: 'cash',
        reference_number: 'CASH123'
      });

    expect(response.status).toBe(201);

    // Verify balance update
    const updatedFolio = await supabase
      .from('folios')
      .select('balance')
      .eq('id', folio.id)
      .single();

    expect(updatedFolio.data.balance).toBe(2000.00); // 5000 - 3000
  });
});
```

### 5. Webhook Integration Tests
```typescript
// tests/integration/webhooks.test.ts
describe('Payment Webhooks', () => {
  test('should process Paystack charge success webhook', async () => {
    const tenant = await createTenant({ subscription_status: 'trialing' });
    const webhookPayload = {
      event: 'charge.success',
      data: {
        reference: 'test_ref_123',
        amount: 10000, // ₦100.00
        status: 'success',
        metadata: {
          tenant_id: tenant.tenant_id,
          plan_id: 'growth'
        }
      }
    };

    const signature = generatePaystackSignature(webhookPayload);
    
    const response = await request(app)
      .post('/functions/v1/paystack-webhook')
      .set('x-paystack-signature', signature)
      .send(webhookPayload);

    expect(response.status).toBe(200);

    // Verify subscription update
    const updatedTenant = await supabase
      .from('tenants')
      .select('subscription_status')
      .eq('tenant_id', tenant.tenant_id)
      .single();

    expect(updatedTenant.data.subscription_status).toBe('active');
  });

  test('should handle webhook signature verification failure', async () => {
    const response = await request(app)
      .post('/functions/v1/paystack-webhook')
      .set('x-paystack-signature', 'invalid_signature')
      .send({ event: 'charge.success', data: {} });

    expect(response.status).toBe(400);
    expect(response.text).toContain('signature verification failed');
  });
});
```

## End-to-End Tests

### 1. Guest Checkout Flow
```typescript
// tests/e2e/checkout.test.ts
describe('Complete Guest Checkout', () => {
  test('should complete full checkout process', async () => {
    // Setup: Guest in room with charges
    await setupGuestInRoom({
      room_number: '101',
      guest_name: 'John Doe',
      charges: [
        { description: 'Room charge', amount: 15000 },
        { description: 'Room service', amount: 2500 }
      ]
    });

    // Navigate to checkout
    await page.goto('/front-desk');
    await page.click('[data-testid="room-101"]');
    await page.click('[data-testid="checkout-button"]');

    // Verify folio display
    await expect(page.locator('[data-testid="total-charges"]')).toContainText('₦17,500.00');

    // Add payment
    await page.click('[data-testid="add-payment"]');
    await page.selectOption('[data-testid="payment-method"]', 'cash');
    await page.fill('[data-testid="payment-amount"]', '17500');
    await page.click('[data-testid="record-payment"]');

    // Complete checkout
    await page.click('[data-testid="complete-checkout"]');

    // Verify success
    await expect(page.locator('[data-testid="checkout-success"]')).toBeVisible();
    
    // Verify room status updated
    await expect(page.locator('[data-testid="room-101-status"]')).toContainText('Dirty');
  });
});
```

### 2. QR Service Request Flow
```typescript
// tests/e2e/qr-service.test.ts
describe('QR Service Request', () => {
  test('should complete service request from QR scan to completion', async () => {
    // Setup QR code for room
    const qrCode = await createQRCode({ room_number: '101' });
    
    // Guest scans QR code
    await page.goto(`/qr/${qrCode.qr_token}`);
    
    // Select service
    await page.click('[data-testid="housekeeping-service"]');
    await page.selectOption('[data-testid="request-type"]', 'cleaning');
    await page.fill('[data-testid="request-notes"]', 'Please replace towels');
    await page.click('[data-testid="submit-request"]');

    // Verify request created
    await expect(page.locator('[data-testid="request-confirmation"]')).toBeVisible();
    const requestId = await page.locator('[data-testid="request-id"]').textContent();

    // Staff receives notification
    await staffPage.goto('/housekeeping');
    await expect(staffPage.locator(`[data-testid="request-${requestId}"]`)).toBeVisible();

    // Staff assigns task
    await staffPage.click(`[data-testid="assign-${requestId}"]`);
    await staffPage.selectOption('[data-testid="assign-staff"]', 'housekeeper-1');
    await staffPage.click('[data-testid="confirm-assignment"]');

    // Complete task
    await staffPage.click(`[data-testid="complete-${requestId}"]`);
    await staffPage.fill('[data-testid="completion-notes"]', 'Towels replaced, bathroom cleaned');
    await staffPage.click('[data-testid="mark-complete"]');

    // Verify completion
    await expect(staffPage.locator(`[data-testid="request-${requestId}-status"]`)).toContainText('Completed');
  });
});
```

### 3. Offline Sync Flow
```typescript
// tests/e2e/offline-sync.test.ts
describe('Offline Operations', () => {
  test('should sync offline actions when connection restored', async () => {
    // Go offline
    await page.setOfflineMode(true);
    
    // Perform offline actions
    await page.goto('/pos');
    await page.click('[data-testid="new-order"]');
    await page.fill('[data-testid="room-number"]', '101');
    await page.click('[data-testid="add-item-sandwich"]');
    await page.click('[data-testid="submit-order"]');

    // Verify offline queue
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-actions"]')).toContainText('1 pending');

    // Go online
    await page.setOfflineMode(false);
    
    // Wait for sync
    await page.waitForSelector('[data-testid="sync-complete"]', { timeout: 10000 });

    // Verify order synced
    await expect(page.locator('[data-testid="pending-actions"]')).toContainText('0 pending');
    
    // Verify order in KDS
    await page.goto('/kds');
    await expect(page.locator('[data-testid="order-for-room-101"]')).toBeVisible();
  });
});
```

## Performance Tests

### 1. Load Testing
```typescript
// tests/performance/load.test.ts
describe('API Load Tests', () => {
  test('should handle concurrent room updates', async () => {
    const promises = Array.from({ length: 50 }, (_, i) => 
      authenticatedRequest('FRONT_DESK')
        .patch(`/rest/v1/rooms?room_number=eq.${100 + i}`)
        .send({ housekeeping_status: 'clean' })
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    expect(successful).toBeGreaterThanOrEqual(45); // 90% success rate
  });

  test('should maintain response times under load', async () => {
    const startTime = Date.now();
    
    const promises = Array.from({ length: 100 }, () =>
      request(app).get('/rest/v1/rooms')
    );

    await Promise.all(promises);
    
    const avgResponseTime = (Date.now() - startTime) / 100;
    expect(avgResponseTime).toBeLessThan(500); // 500ms average
  });
});
```

### 2. Database Performance Tests
```sql
-- tests/performance/database.sql
EXPLAIN ANALYZE 
SELECT r.*, rt.name as room_type_name, f.balance
FROM rooms r
LEFT JOIN room_types rt ON r.room_type_id = rt.id
LEFT JOIN folios f ON r.id = f.room_id AND f.status = 'open'
WHERE r.tenant_id = 'test-tenant-123'
ORDER BY r.room_number;

-- Should use index on (tenant_id, room_number)
-- Execution time should be < 50ms for 1000 rooms
```

## Test Data Management

### 1. Test Database Setup
```sql
-- tests/fixtures/test_schema.sql
-- Create test-specific tables and data
INSERT INTO tenants (tenant_id, hotel_name, plan_id, subscription_status) VALUES
('test-tenant-123', 'Test Hotel', 'growth', 'active'),
('test-tenant-456', 'Another Hotel', 'basic', 'trialing');

INSERT INTO users (id, email, role, tenant_id) VALUES
('test-owner-123', 'owner@testhotel.com', 'OWNER', 'test-tenant-123'),
('test-manager-123', 'manager@testhotel.com', 'MANAGER', 'test-tenant-123'),
('test-frontdesk-123', 'front@testhotel.com', 'FRONT_DESK', 'test-tenant-123');
```

### 2. Test Utilities
```typescript
// tests/utils/helpers.ts
export const createTestTenant = async (overrides = {}) => {
  return await supabase
    .from('tenants')
    .insert({
      tenant_id: generateUUID(),
      hotel_name: 'Test Hotel',
      plan_id: 'growth',
      subscription_status: 'active',
      ...overrides
    })
    .select()
    .single();
};

export const authenticatedRequest = (role: string) => {
  const token = generateTestJWT({ role, tenant_id: testTenantId });
  return request(app).set('Authorization', `Bearer ${token}`);
};

export const setupTestDatabase = async () => {
  await supabase.rpc('truncate_test_tables');
  await supabase.rpc('seed_test_data');
};
```

## Continuous Testing

### 1. CI/CD Pipeline Tests
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Unit Tests
        run: npm run test:unit
      
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres
    steps:
      - name: Setup Test Database
        run: npm run db:test:setup
      - name: Run Integration Tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Start Application
        run: npm run dev &
      - name: Run E2E Tests
        run: npm run test:e2e
```

### 2. Monitoring Tests
```typescript
// tests/monitoring/synthetic.test.ts
// Synthetic monitoring tests for production
describe('Production Health Checks', () => {
  test('should respond to health check endpoint', async () => {
    const response = await fetch('https://api.hotel.com/health');
    expect(response.status).toBe(200);
    
    const health = await response.json();
    expect(health.database).toBe('healthy');
    expect(health.realtime).toBe('healthy');
  });

  test('should authenticate production endpoints', async () => {
    const response = await fetch('https://api.hotel.com/rest/v1/rooms', {
      headers: { 'Authorization': `Bearer ${process.env.PROD_TEST_TOKEN}` }
    });
    
    expect(response.status).not.toBe(401);
  });
});
```

This comprehensive test plan ensures all aspects of the hotel management system are thoroughly tested, from individual functions to complete user workflows, with appropriate performance and monitoring coverage.