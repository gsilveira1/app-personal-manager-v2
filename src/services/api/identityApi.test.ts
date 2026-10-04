// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../utils/apiClient', () => ({ default: vi.fn(), API_BASE_URL: 'http://api.test/api' }))

import apiClient from '../../utils/apiClient'
import * as api from './apiService'

const client = vi.mocked(apiClient)

describe('identity API layer (contract v2 §6.1, §6.6)', () => {
  beforeEach(() => {
    client.mockReset()
    client.mockResolvedValue({} as never)
  })

  it.each([
    ['updateBranding', () => api.updateBranding({ primaryColor: '#112233' }), '/users/branding', 'PATCH', { primaryColor: '#112233' }],
    ['completeSetup', () => api.completeSetup(), '/users/setup/complete', 'POST', undefined],
    ['connectWhatsapp', () => api.connectWhatsapp(), '/whatsapp/connect', 'POST', undefined],
    ['disconnectWhatsapp', () => api.disconnectWhatsapp(), '/whatsapp/disconnect', 'POST', undefined],
    ['sendWhatsappTestMessage', () => api.sendWhatsappTestMessage({ phone: '5553999990000', message: 'oi' }), '/whatsapp/test-message', 'POST', { phone: '5553999990000', message: 'oi' }],
    ['updateDndSettings', () => api.updateDndSettings({ enabled: false }), '/settings/dnd', 'PATCH', { enabled: false }],
    ['updateAiInstructions', () => api.updateAiInstructions('be brief'), '/settings/ai-instructions', 'PUT', { instructions: 'be brief' }],
    ['updateAdminUser', () => api.updateAdminUser('u1', { status: 'BLOCKED', limits: { maxStudents: 10 } }), '/admin/users/u1', 'PATCH', { status: 'BLOCKED', limits: { maxStudents: 10 } }],
  ])('%s calls the v2 route', async (_name, call, path, method, body) => {
    await call()

    expect(client).toHaveBeenCalledTimes(1)
    const [calledPath, options] = client.mock.calls[0]
    expect(calledPath).toBe(path)
    expect(options?.method).toBe(method)
    expect(options?.body ? JSON.parse(options.body as string) : undefined).toEqual(body)
  })

  it('reads the WhatsApp status and the current user from the user-scoped routes', async () => {
    await api.getWhatsappStatus()
    await api.fetchCurrentUser()

    expect(client.mock.calls.map(([path]) => path)).toEqual(['/whatsapp/status', '/auth/me'])
  })

  it('lists accounts from /admin/users with the given filters', async () => {
    await api.getAdminUsers({ page: 2, limit: 10, status: 'OVERDUE' })

    expect(client).toHaveBeenCalledWith('/admin/users?page=2&limit=10&status=OVERDUE')
  })

  it('no longer exposes the tenant or tenant-admin calls', () => {
    for (const removed of ['getMyTenant', 'updateTenantBranding', 'connectTenantWhatsapp', 'completeTenantSetup', 'getAdminTenants', 'createAdminTenant', 'updateAdminTenant']) {
      expect(api).not.toHaveProperty(removed)
    }
  })

  describe('logout (contract v2 §8: the server keeps no session)', () => {
    const storage = new Map<string, string>()

    beforeEach(() => {
      storage.clear()
      storage.set('token', 'stale-token')
      storage.set('user', '{"id":"u1"}')
      vi.stubGlobal('localStorage', {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => void storage.set(key, value),
        removeItem: (key: string) => void storage.delete(key),
      })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      vi.restoreAllMocks()
    })

    it('asks the API to confirm and clears the stored session', async () => {
      await api.logout()

      expect(client).toHaveBeenCalledWith('/auth/logout', { method: 'POST' })
      expect([...storage.keys()]).toEqual([])
    })

    it('still clears the stored session when the API refuses the token (401), and reports it', async () => {
      const refusal = Object.assign(new Error('Unauthorized'), { status: 401 })
      client.mockRejectedValue(refusal)
      const logged = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(api.logout()).resolves.toBeUndefined()

      expect([...storage.keys()]).toEqual([])
      expect(logged).toHaveBeenCalledWith(expect.stringContaining('logout'), refusal)
    })
  })
})
