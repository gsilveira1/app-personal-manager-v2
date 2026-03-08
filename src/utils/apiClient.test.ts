// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Polyfill localStorage for node environment
const storage: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => storage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { storage[key] = value }),
  removeItem: vi.fn((key: string) => { delete storage[key] }),
  clear: vi.fn(() => { Object.keys(storage).forEach(k => delete storage[k]) }),
  get length() { return Object.keys(storage).length },
  key: vi.fn((i: number) => Object.keys(storage)[i] ?? null),
}
vi.stubGlobal('localStorage', localStorageMock)
import apiClient, { ApiError } from './apiClient'

describe('apiClient', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    Object.keys(storage).forEach(k => delete storage[k])
  })

  afterEach(() => {
    mockFetch.mockReset()
  })

  it('should prepend base URL to endpoint', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    })

    await apiClient('/clients')

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:9090/api/clients',
      expect.any(Object),
    )
  })

  it('should attach Bearer token from localStorage', async () => {
    storage['token'] = 'my-jwt-token'
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })

    await apiClient('/test')

    const callHeaders = mockFetch.mock.calls[0][1].headers
    expect(callHeaders['Authorization']).toBe('Bearer my-jwt-token')
  })

  it('should not attach Authorization header when no token', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })

    await apiClient('/test')

    const callHeaders = mockFetch.mock.calls[0][1].headers
    expect(callHeaders['Authorization']).toBeUndefined()
  })

  it('should set Content-Type to application/json', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })

    await apiClient('/test')

    const callHeaders = mockFetch.mock.calls[0][1].headers
    expect(callHeaders['Content-Type']).toBe('application/json')
  })

  it('should return parsed JSON on 2xx response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '1', name: 'Maria' }),
    })

    const result = await apiClient('/clients')
    expect(result).toEqual({ id: '1', name: 'Maria' })
  })

  it('should return null on 204 No Content', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve(null),
    })

    const result = await apiClient('/clients/1')
    expect(result).toBeNull()
  })

  it('should throw ApiError with status on 401', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ message: 'Invalid credentials' }),
    })

    await expect(apiClient('/auth/login')).rejects.toThrow(ApiError)

    try {
      await apiClient('/auth/login')
    } catch (error) {
      expect((error as ApiError).status).toBe(401)
      expect((error as ApiError).message).toBe('Invalid credentials')
    }
  })

  it('should throw ApiError with status on 404', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ message: 'Resource not found' }),
    })

    await expect(apiClient('/clients/999')).rejects.toThrow(ApiError)
  })

  it('should throw ApiError with status on 500', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('Not JSON')),
    })

    try {
      await apiClient('/test')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).status).toBe(500)
    }
  })

  it('should throw ApiError with status 0 on network failure', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

    try {
      await apiClient('/test')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).status).toBe(0)
      expect((error as ApiError).message).toContain('network error')
    }
  })
})
