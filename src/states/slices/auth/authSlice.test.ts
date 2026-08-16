// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { create } from 'zustand'

import { createAuthSlice, type AuthSlice } from './authSlice'

vi.mock('../../../services/api/apiService', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}))

import * as api from '../../../services/api/apiService'

const mockApi = api as {
  login: ReturnType<typeof vi.fn>
  signup: ReturnType<typeof vi.fn>
  logout: ReturnType<typeof vi.fn>
  getCurrentUser: ReturnType<typeof vi.fn>
}

const createTestStore = () => create<AuthSlice>()((...a) => ({ ...createAuthSlice(...a) }))

describe('authSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should have user=null, isAuthenticated=false, isLoading=true', () => {
      const state = store.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(true)
    })
  })

  describe('login', () => {
    it('should set user and isAuthenticated on success', async () => {
      const mockUser = { id: '1', name: 'João', email: 'joao@test.com' }
      mockApi.login.mockResolvedValue({ user: mockUser, token: 'jwt-token' })

      await store.getState().login('joao@test.com', 'senha123')

      const state = store.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
    })
  })

  describe('logout', () => {
    it('should clear user and isAuthenticated', async () => {
      mockApi.logout.mockResolvedValue(undefined)

      await store.getState().logout()

      const state = store.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })
})
