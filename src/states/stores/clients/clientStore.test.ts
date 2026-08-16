// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../services/api/apiService', () => ({
  createClient: vi.fn(),
  updateClient: vi.fn(),
  deleteClient: vi.fn(),
  convertLead: vi.fn(),
  getAvatarUploadUrl: vi.fn(),
  createPlan: vi.fn(),
}))

vi.mock('../../../utils/uploadToGcs', () => ({
  uploadFileToGcs: vi.fn().mockResolvedValue(undefined),
}))

import * as api from '../../../services/api/apiService'
import { useClientStore } from './clientStore'

const mockApi = api as Record<string, ReturnType<typeof vi.fn>>

describe('clientStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useClientStore.setState({ clients: [], plans: [] })
  })

  it('should initialize with empty clients array', () => {
    expect(useClientStore.getState().clients).toEqual([])
  })

  it('should manage clients state correctly (sync)', () => {
    const client = { id: '1', name: 'Maria', email: 'maria@test.com', phone: '123', status: 'Active' as const, type: 'In-Person' as const }
    useClientStore.getState()._addClient(client)
    expect(useClientStore.getState().clients).toEqual([client])

    useClientStore.getState()._updateClient({ ...client, name: 'Maria Silva' })
    expect(useClientStore.getState().clients[0].name).toBe('Maria Silva')

    useClientStore.getState()._removeClient('1')
    expect(useClientStore.getState().clients).toEqual([])
  })

  describe('addClient', () => {
    it('should call createClient API and add to store', async () => {
      const newClient = { id: 'c-1', name: 'João', email: 'joao@test.com', phone: '123', status: 'Active', type: 'In-Person' }
      mockApi.createClient.mockResolvedValue(newClient)

      await useClientStore.getState().addClient({ name: 'João', email: 'joao@test.com', phone: '123', status: 'Active', type: 'In-Person' } as any)

      expect(mockApi.createClient).toHaveBeenCalled()
      expect(useClientStore.getState().clients).toHaveLength(1)
      expect(useClientStore.getState().clients[0].id).toBe('c-1')
    })

    it('should create a custom plan first when customPlanData is provided', async () => {
      const plan = { id: 'p-new', name: 'Custom', type: 'PRESENCIAL', sessionsPerWeek: 3, price: 300 }
      mockApi.createPlan.mockResolvedValue(plan)
      mockApi.createClient.mockResolvedValue({ id: 'c-new', name: 'Test', planId: 'p-new' })

      await useClientStore
        .getState()
        .addClient({ name: 'Test', email: 't@t.com', phone: '1', status: 'Active', type: 'In-Person' } as any, { name: 'Custom', type: 'PRESENCIAL', sessionsPerWeek: 3, price: 300 } as any)

      expect(mockApi.createPlan).toHaveBeenCalled()
      expect(mockApi.createClient).toHaveBeenCalled()
      expect(useClientStore.getState().clients[0].planId).toBe('p-new')
    })
  })

  describe('updateClient', () => {
    it('should call updateClient API and update in store', async () => {
      const client = { id: '1', name: 'Maria', email: 'maria@test.com', phone: '123', status: 'Active', type: 'In-Person' }
      useClientStore.setState({ clients: [client] as any })

      const updated = { ...client, name: 'Maria Santos' }
      mockApi.updateClient.mockResolvedValue(updated)

      await useClientStore.getState().updateClient('1', { name: 'Maria Santos' })

      expect(useClientStore.getState().clients[0].name).toBe('Maria Santos')
    })
  })

  describe('deleteClient', () => {
    it('should call deleteClient API and remove from store', async () => {
      useClientStore.setState({ clients: [{ id: '1', name: 'Maria' }] as any })
      mockApi.deleteClient.mockResolvedValue(undefined)

      await useClientStore.getState().deleteClient('1')

      expect(useClientStore.getState().clients).toHaveLength(0)
    })
  })

  describe('convertLead', () => {
    it('should call convertLead API and update client status', async () => {
      const client = { id: '1', name: 'Lead', status: 'Lead' }
      useClientStore.setState({ clients: [client] as any })

      const updated = { ...client, status: 'Active', planId: 'plan-1' }
      mockApi.convertLead.mockResolvedValue(updated)

      await useClientStore.getState().convertLead('1', 'plan-1')

      expect(useClientStore.getState().clients[0].status).toBe('Active')
    })
  })

  describe('uploadClientAvatar', () => {
    it('should get upload URL, upload file, and update client avatar', async () => {
      useClientStore.setState({ clients: [{ id: 'c1', name: 'Test' }] as any })
      mockApi.getAvatarUploadUrl.mockResolvedValue({ uploadUrl: 'https://upload.url', publicUrl: 'https://public.url' })
      mockApi.updateClient.mockResolvedValue({ id: 'c1', name: 'Test', avatar: 'https://public.url' })

      const file = new File(['img'], 'avatar.jpg', { type: 'image/jpeg' })
      await useClientStore.getState().uploadClientAvatar('c1', file)

      expect(mockApi.getAvatarUploadUrl).toHaveBeenCalledWith('c1', 'image/jpeg')
      expect(useClientStore.getState().clients[0].avatar).toBe('https://public.url')
    })
  })
})
