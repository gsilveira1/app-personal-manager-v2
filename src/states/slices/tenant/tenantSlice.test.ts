import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore } from 'zustand'
import { createTenantSlice, type TenantSlice } from './tenantSlice'
import * as api from '../../../services/api/apiService'

vi.mock('../../../services/api/apiService')

describe('tenantSlice', () => {
  let store: any

  beforeEach(() => {
    vi.clearAllMocks()
    store = createStore<TenantSlice>()((...a) => ({
      ...createTenantSlice(...a),
    }))
  })

  it('should initialize with default state', () => {
    const state = store.getState()
    expect(state.tenant).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.qrCode).toBeNull()
    expect(state.whatsappStatus).toBeNull()
  })

  it('should fetch tenant successfully', async () => {
    const mockTenant = {
      id: 'tenant-1',
      name: 'Vivi Studio',
      slug: 'vivi-studio',
      primaryColor: '#10B981',
      setupCompleted: false,
      whatsappStatus: 'PENDING',
    }

    vi.mocked(api.getMyTenant).mockResolvedValue(mockTenant as any)

    await store.getState().fetchTenant()

    expect(store.getState().tenant).toEqual(mockTenant)
    expect(store.getState().whatsappStatus).toBe('PENDING')
    expect(store.getState().isLoading).toBe(false)
  })

  it('should update branding', async () => {
    const mockUpdatedTenant = {
      id: 'tenant-1',
      name: 'Vivi Studio',
      slug: 'vivi-studio',
      primaryColor: '#3B82F6',
      logoUrl: 'https://pub-r2.viviops.com/logos/1.png',
      setupCompleted: false,
    }

    vi.mocked(api.updateTenantBranding).mockResolvedValue(mockUpdatedTenant as any)

    await store.getState().updateBranding({ primaryColor: '#3B82F6' })

    expect(store.getState().tenant).toEqual(mockUpdatedTenant)
  })

  it('should connect whatsapp and store qrCode and status', async () => {
    const mockResponse = {
      instanceName: 'tenant-1',
      qrcodeBase64: 'data:image/png;base64,mockqr',
      status: 'PENDING' as const,
    }

    vi.mocked(api.connectTenantWhatsapp).mockResolvedValue(mockResponse)

    await store.getState().connectWhatsapp()

    expect(store.getState().qrCode).toBe('data:image/png;base64,mockqr')
    expect(store.getState().whatsappStatus).toBe('PENDING')
  })

  it('should complete setup', async () => {
    const mockResponse = {
      success: true,
      tenant: {
        id: 'tenant-1',
        name: 'Vivi Studio',
        slug: 'vivi-studio',
        setupCompleted: true,
      },
    }

    vi.mocked(api.completeTenantSetup).mockResolvedValue(mockResponse as any)

    await store.getState().completeSetup()

    expect(store.getState().tenant.setupCompleted).toBe(true)
  })
})
