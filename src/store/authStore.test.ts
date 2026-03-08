// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAuthStore } from './authStore'

vi.mock('../services/apiService', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}))

import * as api from '../services/apiService'

const mockApi = api as {
  login: ReturnType<typeof vi.fn>
  signup: ReturnType<typeof vi.fn>
  logout: ReturnType<typeof vi.fn>
  getCurrentUser: ReturnType<typeof vi.fn>
}

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should have user=null, isAuthenticated=false, isLoading=true', () => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(true)
    })
  })

  describe('login', () => {
    it('should set user and isAuthenticated on success', async () => {
      const mockUser = { id: '1', name: 'João', email: 'joao@test.com' }
      mockApi.login.mockResolvedValue({ user: mockUser, token: 'jwt-token' })

      await useAuthStore.getState().login('joao@test.com', 'senha123')

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
    })

    it('should throw and not set user on API error', async () => {
      mockApi.login.mockRejectedValue(new Error('Invalid credentials'))

      await expect(useAuthStore.getState().login('bad@test.com', 'wrong')).rejects.toThrow()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('signup', () => {
    it('should set user and isAuthenticated on success', async () => {
      const mockUser = { id: '2', name: 'Maria', email: 'maria@test.com' }
      mockApi.signup.mockResolvedValue({ user: mockUser, token: 'jwt-token' })

      await useAuthStore.getState().signup('Maria', 'maria@test.com', 'senha123')

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
    })

    it('should throw and not set user on API error', async () => {
      mockApi.signup.mockRejectedValue(new Error('Email already exists'))

      await expect(useAuthStore.getState().signup('Maria', 'dup@test.com', 'senha123')).rejects.toThrow()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
    })
  })

  describe('logout', () => {
    it('should clear user and isAuthenticated', async () => {
      // First set user as logged in
      useAuthStore.setState({ user: { id: '1', name: 'João', email: 'joao@test.com' }, isAuthenticated: true })
      mockApi.logout.mockResolvedValue(undefined)

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('checkAuthStatus', () => {
    it('should set user when valid token exists', async () => {
      const mockUser = { id: '1', name: 'João', email: 'joao@test.com' }
      mockApi.getCurrentUser.mockResolvedValue(mockUser)

      await useAuthStore.getState().checkAuthStatus()

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
    })

    it('should clear state when no user returned (no token)', async () => {
      mockApi.getCurrentUser.mockResolvedValue(null)

      await useAuthStore.getState().checkAuthStatus()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
    })

    it('should clear state on error (expired/invalid token)', async () => {
      mockApi.getCurrentUser.mockRejectedValue(new Error('Unauthorized'))

      await useAuthStore.getState().checkAuthStatus()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
    })

    it('should set isLoading=true during check, false after', async () => {
      let resolvePromise: (value: any) => void
      const pendingPromise = new Promise((resolve) => { resolvePromise = resolve })
      mockApi.getCurrentUser.mockReturnValue(pendingPromise)

      const promise = useAuthStore.getState().checkAuthStatus()
      expect(useAuthStore.getState().isLoading).toBe(true)

      resolvePromise!({ id: '1', name: 'Test', email: 'test@test.com' })
      await promise

      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })
})
