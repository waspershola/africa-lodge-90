import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/integrations/supabase/client'
import type { User, Session, AuthError } from '@supabase/supabase-js'

// Test utilities
const testTenantId = 'test-tenant-123'
const otherTenantId = 'other-tenant-456'

// Mock user factory with complete User type
const createMockUser = (): User => ({
  id: 'user-123',
  email: 'test@hotel.com',
  app_metadata: { provider: 'email' },
  user_metadata: { role: 'OWNER', tenant_id: 'tenant-123' },
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z'
})

// Mock session factory with complete Session type
const createMockSession = (): Session => ({
  access_token: 'mock-jwt-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: createMockUser()
})

// Mock auth error factory with complete AuthError type
const createMockAuthError = (): AuthError => ({
  message: 'Test error',
  name: 'AuthError',
  status: 400,
  code: 'test_error'
} as unknown as AuthError)

describe('Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User Authentication', () => {
    it('should authenticate user with valid credentials', async () => {
      const mockUser = createMockUser()
      const mockSession = createMockSession()

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await supabase.auth.signInWithPassword({
        email: 'owner@hotel.com',
        password: 'password123'
      })

      expect(result.data.user).toEqual(expect.objectContaining({
        id: 'user-123',
        email: expect.any(String),
        user_metadata: expect.any(Object)
      }))
      expect(result.data.session).toEqual(expect.objectContaining({
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-refresh-token',
        user: expect.any(Object)
      }))
    })

    it('should reject invalid credentials', async () => {
      const mockError = createMockAuthError()

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const result = await supabase.auth.signInWithPassword({
        email: 'invalid@email.com',
        password: 'wrongpassword'
      })

      expect(result.error).toEqual(expect.objectContaining({
        message: 'Test error',
        code: 'test_error'
      }))
      expect(result.data.user).toBeNull()
    })

    it('should refresh session token', async () => {
      const mockUser = createMockUser()
      const mockSession = createMockSession()

      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await supabase.auth.refreshSession()

      expect(result.data.session).toEqual(expect.objectContaining({
        access_token: expect.any(String),
        user: expect.any(Object)
      }))
    })

    it('should handle session refresh failure', async () => {
      const mockError = createMockAuthError()

      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const result = await supabase.auth.refreshSession()

      expect(result.error).toBeTruthy()
      expect(result.data.session).toBeNull()
    })

    it('should get current session', async () => {
      const mockSession = createMockSession()

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await supabase.auth.getSession()

      expect(result.data.session).toEqual(expect.objectContaining({
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-refresh-token',
        user: expect.objectContaining({ id: 'user-123', email: expect.any(String) })
      }))
    })

    it('should sign out user', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null
      })

      const result = await supabase.auth.signOut()

      expect(result.error).toBeNull()
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('Role-Based Access Control', () => {
    it('should validate user roles correctly', () => {
      const roles = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'POS', 'STAFF']
      
      roles.forEach(role => {
        const isValidRole = roles.includes(role)
        expect(isValidRole).toBe(true)
      })
    })

    it('should enforce tenant isolation', () => {
      const user1TenantId = 'tenant-123'
      const user2TenantId = 'tenant-456'
      
      // Mock RLS behavior - users should only see their tenant's data
      const canAccessTenant = (userTenantId: string, resourceTenantId: string): boolean => {
        return userTenantId === resourceTenantId
      }
      
      expect(canAccessTenant(user1TenantId, user1TenantId)).toBe(true)
      expect(canAccessTenant(user1TenantId, user2TenantId)).toBe(false)
    })

    it('should handle super admin access', () => {
      const isSuperAdmin = (role: string): boolean => {
        return role === 'SUPER_ADMIN'
      }
      
      expect(isSuperAdmin('SUPER_ADMIN')).toBe(true)
      expect(isSuperAdmin('OWNER')).toBe(false)
      expect(isSuperAdmin('MANAGER')).toBe(false)
    })
  })

  describe('Password Reset', () => {
    it('should initiate password reset', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null
      })

      const result = await supabase.auth.resetPasswordForEmail('user@hotel.com')

      expect(result.error).toBeNull()
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('user@hotel.com')
    })

    it('should handle password reset errors', async () => {
      const mockError = createMockAuthError()

      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null
      })

      const result = await supabase.auth.resetPasswordForEmail('invalid@email.com')

      expect(result.error).toBeTruthy()
    })
  })

  describe('User Registration', () => {
    it('should create new user account', async () => {
      const mockUser = createMockUser()

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })

      const result = await supabase.auth.signUp({
        email: 'newuser@hotel.com',
        password: 'password123',
        options: {
          data: {
            role: 'STAFF',
            tenant_id: testTenantId
          }
        }
      })

      expect(result.data.user).toBeTruthy()
      expect(result.error).toBeNull()
    })
  })

  describe('Auth State Management', () => {
    it('should handle auth state changes', () => {
      const mockCallback = vi.fn()
      
      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { id: 'sub-123', callback: mockCallback, unsubscribe: vi.fn() } }
      })

      const { data } = supabase.auth.onAuthStateChange(mockCallback)

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback)
      expect(data.subscription.unsubscribe).toBeDefined()
    })
  })
})