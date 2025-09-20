import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Create comprehensive mocks that match Supabase types
const createMockUser = () => ({
  id: 'user-123',
  email: 'test@hotel.com',
  app_metadata: { provider: 'email' },
  user_metadata: { role: 'OWNER', tenant_id: 'tenant-123' },
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z'
})

const createMockSession = () => ({
  access_token: 'mock-jwt-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: createMockUser()
})

const createMockAuthError = () => ({
  message: 'Test error',
  name: 'AuthError',
  status: 400,
  code: 'test_error',
  __isAuthError: true
})

// Mock Supabase client with proper types
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: createMockUser() }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: createMockUser(), session: createMockSession() }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: createMockUser(), session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: createMockSession() }, error: null }),
      refreshSession: vi.fn().mockResolvedValue({ data: { session: createMockSession(), user: createMockUser() }, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  }
}))

// Mock other dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
    useParams: () => ({}),
  }
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})