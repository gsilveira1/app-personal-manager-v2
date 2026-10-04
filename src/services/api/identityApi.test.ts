// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

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
})
