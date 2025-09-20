import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 500 }, // Stay at 500 users
    { duration: '2m', target: 1000 }, // Ramp up to 1000 users
    { duration: '5m', target: 1000 }, // Stay at 1000 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.02'], // Error rate under 2%
    errors: ['rate<0.05'],
  },
};

const BASE_URL = 'https://dxisnnjsbuuiunjmzzqj.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aXNubmpzYnV1aXVuam16enFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg2MDMsImV4cCI6MjA3Mzg2NDYwM30.nmuC7AAV-6PMpIPvOed28P0SAlL04PIUNibaq4OogU8';

// Generate test tenant IDs
const TENANT_IDS = Array.from({ length: 10 }, (_, i) => `tenant-${i + 1}`);

function getRandomTenant() {
  return TENANT_IDS[Math.floor(Math.random() * TENANT_IDS.length)];
}

export default function () {
  const tenant = getRandomTenant();
  
  // Headers for API requests
  const headers = {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  // Test 1: Fetch rooms for tenant
  const roomsResponse = http.get(`${BASE_URL}/rest/v1/rooms?tenant_id=eq.${tenant}`, {
    headers: headers
  });

  check(roomsResponse, {
    'rooms fetch status is 200': (r) => r.status === 200,
    'rooms fetch duration < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Fetch reservations
  const reservationsResponse = http.get(`${BASE_URL}/rest/v1/reservations?tenant_id=eq.${tenant}&limit=20`, {
    headers: headers
  });

  check(reservationsResponse, {
    'reservations fetch status is 200': (r) => r.status === 200,
    'reservations fetch duration < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Fetch QR orders
  const qrOrdersResponse = http.get(`${BASE_URL}/rest/v1/qr_orders?tenant_id=eq.${tenant}&limit=50`, {
    headers: headers
  });

  check(qrOrdersResponse, {
    'qr orders fetch status is 200': (r) => r.status === 200,
    'qr orders fetch duration < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: Create QR order (simulate guest request)
  const newQROrder = {
    qr_code_id: `qr-${tenant}-${Math.floor(Math.random() * 1000)}`,
    service_type: 'housekeeping',
    request_details: {
      type: 'cleaning',
      notes: `Load test request ${Math.random()}`
    },
    tenant_id: tenant,
    status: 'pending'
  };

  const createOrderResponse = http.post(`${BASE_URL}/rest/v1/qr_orders`, JSON.stringify(newQROrder), {
    headers: headers
  });

  check(createOrderResponse, {
    'create order status is 201': (r) => r.status === 201,
    'create order duration < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);

  // Test 5: Fetch POS orders
  const posOrdersResponse = http.get(`${BASE_URL}/rest/v1/pos_orders?tenant_id=eq.${tenant}&limit=30`, {
    headers: headers
  });

  check(posOrdersResponse, {
    'pos orders fetch status is 200': (r) => r.status === 200,
    'pos orders fetch duration < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test 6: Fetch housekeeping tasks
  const housekeepingResponse = http.get(`${BASE_URL}/rest/v1/housekeeping_tasks?tenant_id=eq.${tenant}&limit=40`, {
    headers: headers
  });

  check(housekeepingResponse, {
    'housekeeping fetch status is 200': (r) => r.status === 200,
    'housekeeping fetch duration < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(2);
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed');
}
