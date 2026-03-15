// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Polyfill localStorage for node environment
const storage: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value },
  removeItem: (key: string) => { delete storage[key] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
  get length() { return Object.keys(storage).length },
  key: (i: number) => Object.keys(storage)[i] ?? null,
}
vi.stubGlobal('localStorage', localStorageMock)

vi.mock('../utils/apiClient', () => ({
  default: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.name = 'ApiError'
      this.status = status
    }
  },
}))

import apiClient from '../utils/apiClient'
import * as api from './apiService'

const mockApiClient = apiClient as ReturnType<typeof vi.fn>

describe('apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('login', () => {
    it('should POST /auth/login and store token', async () => {
      mockApiClient.mockResolvedValue({ user: { id: '1', name: 'João' }, access_token: 'jwt-123' })

      const result = await api.login('joao@test.com', 'senha123')

      expect(mockApiClient).toHaveBeenCalledWith('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'joao@test.com', password: 'senha123' }),
      })
      expect(localStorage.getItem('token')).toBe('jwt-123')
      expect(result.user.name).toBe('João')
    })
  })

  describe('signup', () => {
    it('should POST /auth/signup and store token', async () => {
      mockApiClient.mockResolvedValue({ user: { id: '1', name: 'Maria' }, access_token: 'jwt-456' })

      const result = await api.signup('Maria', 'maria@test.com', 'senha123')

      expect(mockApiClient).toHaveBeenCalledWith('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name: 'Maria', email: 'maria@test.com', password: 'senha123' }),
      })
      expect(localStorage.getItem('token')).toBe('jwt-456')
    })
  })

  describe('logout', () => {
    it('should POST /auth/logout and remove token', async () => {
      localStorage.setItem('token', 'jwt-123')
      mockApiClient.mockResolvedValue(undefined)

      await api.logout()

      expect(mockApiClient).toHaveBeenCalledWith('/auth/logout', { method: 'POST' })
      expect(localStorage.getItem('token')).toBeNull()
    })
  })

  describe('getCurrentUser', () => {
    it('should GET /auth/me when token exists', async () => {
      localStorage.setItem('token', 'jwt-123')
      mockApiClient.mockResolvedValue({ id: '1', name: 'João' })

      const result = await api.getCurrentUser()

      expect(mockApiClient).toHaveBeenCalledWith('/auth/me')
      expect(result!.name).toBe('João')
    })

    it('should return null when no token', async () => {
      const result = await api.getCurrentUser()
      expect(result).toBeNull()
      expect(mockApiClient).not.toHaveBeenCalled()
    })

    it('should return null on error', async () => {
      localStorage.setItem('token', 'expired')
      mockApiClient.mockRejectedValue(new Error('Unauthorized'))

      const result = await api.getCurrentUser()
      expect(result).toBeNull()
    })
  })

  describe('getClients', () => {
    it('should GET /clients', async () => {
      mockApiClient.mockResolvedValue([{ id: '1', name: 'Maria' }])
      const result = await api.getClients()
      expect(mockApiClient).toHaveBeenCalledWith('/clients')
      expect(result).toHaveLength(1)
    })
  })

  describe('createClient', () => {
    it('should POST /clients with body', async () => {
      const clientData = { name: 'Maria', email: 'maria@test.com', phone: '123', type: 'In-Person' }
      mockApiClient.mockResolvedValue({ id: '1', ...clientData })

      await api.createClient(clientData as any)

      expect(mockApiClient).toHaveBeenCalledWith('/clients', {
        method: 'POST',
        body: JSON.stringify(clientData),
      })
    })
  })

  describe('updateClient', () => {
    it('should PATCH /clients/:id with body', async () => {
      mockApiClient.mockResolvedValue({ id: '1', name: 'Updated' })

      await api.updateClient('1', { name: 'Updated' })

      expect(mockApiClient).toHaveBeenCalledWith('/clients/1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated' }),
      })
    })
  })

  describe('deleteClient', () => {
    it('should DELETE /clients/:id', async () => {
      mockApiClient.mockResolvedValue(undefined)

      await api.deleteClient('1')

      expect(mockApiClient).toHaveBeenCalledWith('/clients/1', { method: 'DELETE' })
    })
  })

  describe('convertLead', () => {
    it('should PATCH /clients/:id/convert with planId', async () => {
      mockApiClient.mockResolvedValue({ id: '1', status: 'Active' })

      await api.convertLead('1', 'plan-uuid')

      expect(mockApiClient).toHaveBeenCalledWith('/clients/1/convert', {
        method: 'PATCH',
        body: JSON.stringify({ planId: 'plan-uuid' }),
      })
    })

    it('should PATCH /clients/:id/convert without planId', async () => {
      mockApiClient.mockResolvedValue({ id: '1', status: 'Active' })

      await api.convertLead('1')

      expect(mockApiClient).toHaveBeenCalledWith('/clients/1/convert', {
        method: 'PATCH',
        body: JSON.stringify({}),
      })
    })
  })

  describe('getSessions', () => {
    it('should GET /sessions', async () => {
      mockApiClient.mockResolvedValue([])
      await api.getSessions()
      expect(mockApiClient).toHaveBeenCalledWith('/sessions')
    })
  })

  describe('createSession', () => {
    it('should POST /sessions with body', async () => {
      const data = { clientId: 'c1', date: '2025-02-01', durationMinutes: 60, type: 'In-Person', category: 'Workout' }
      mockApiClient.mockResolvedValue({ id: 's1', ...data })

      await api.createSession(data as any)

      expect(mockApiClient).toHaveBeenCalledWith('/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    })
  })

  describe('toggleSessionComplete', () => {
    it('should POST /sessions/:id/toggle-complete', async () => {
      mockApiClient.mockResolvedValue({ id: 's1', completed: true })

      await api.toggleSessionComplete('s1')

      expect(mockApiClient).toHaveBeenCalledWith('/sessions/s1/toggle-complete', { method: 'POST' })
    })
  })

  describe('getWorkouts', () => {
    it('should GET /workouts', async () => {
      mockApiClient.mockResolvedValue([])
      await api.getWorkouts()
      expect(mockApiClient).toHaveBeenCalledWith('/workouts')
    })
  })

  describe('getEvaluations', () => {
    it('should GET /evaluations', async () => {
      mockApiClient.mockResolvedValue([])
      await api.getEvaluations()
      expect(mockApiClient).toHaveBeenCalledWith('/evaluations')
    })
  })

  describe('getPlans', () => {
    it('should GET /plans', async () => {
      mockApiClient.mockResolvedValue([])
      await api.getPlans()
      expect(mockApiClient).toHaveBeenCalledWith('/plans')
    })
  })
})
