import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore } from 'zustand'
import { createAccountSlice, type AccountSlice } from './accountSlice'
import * as api from '../../../services/api/apiService'

vi.mock('../../../services/api/apiService')

const account = {
  id: 'user-1',
  name: 'Vivi Studio',
  slug: 'vivi-studio',
  primaryColor: '#10B981',
  logoUrl: null,
  setupCompleted: false,
  whatsappStatus: 'PENDING',
  whatsappInstanceName: null,
}

describe('accountSlice', () => {
  let store: ReturnType<typeof createStore<AccountSlice>>

  beforeEach(() => {
    vi.clearAllMocks()
    store = createStore<AccountSlice>()((...a) => ({
      ...createAccountSlice(...a),
    }))
  })

  it('should initialize with default state', () => {
    const state = store.getState()
    expect(state.account).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.qrCode).toBeNull()
    expect(state.whatsappStatus).toBeNull()
  })

  it('reads the account from the current user, including its WhatsApp status', async () => {
    vi.mocked(api.fetchCurrentUser).mockResolvedValue(account as any)

    await store.getState().fetchAccount()

    expect(store.getState().account).toEqual(account)
    expect(store.getState().whatsappStatus).toBe('PENDING')
    expect(store.getState().isLoading).toBe(false)
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#10B981')
  })

  it('records the error and resolves to null when the account cannot be read', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.fetchCurrentUser).mockRejectedValue(new Error('Unauthorized'))

    await expect(store.getState().fetchAccount()).resolves.toBeNull()

    expect(store.getState().error).toBe('Unauthorized')
    expect(store.getState().isLoading).toBe(false)
  })

  it('stores the user returned by the branding update', async () => {
    const updated = { ...account, primaryColor: '#3B82F6', logoUrl: 'https://cdn.example.com/logos/1.png' }
    vi.mocked(api.updateBranding).mockResolvedValue(updated as any)

    await store.getState().updateBranding({ primaryColor: '#3B82F6' })

    expect(api.updateBranding).toHaveBeenCalledWith({ primaryColor: '#3B82F6' })
    expect(store.getState().account).toEqual(updated)
  })

  it('should connect whatsapp and store qrCode and status', async () => {
    vi.mocked(api.connectWhatsapp).mockResolvedValue({
      instanceName: 'user-1234abcd',
      qrcodeBase64: 'data:image/png;base64,mockqr',
      status: 'PENDING',
    })

    await store.getState().connectWhatsapp()

    expect(store.getState().qrCode).toBe('data:image/png;base64,mockqr')
    expect(store.getState().whatsappStatus).toBe('PENDING')
  })

  it('rethrows a failed connect (e.g. 503 provider not configured) and keeps the message', async () => {
    vi.mocked(api.connectWhatsapp).mockRejectedValue(new Error('WhatsApp provider is not configured'))

    await expect(store.getState().connectWhatsapp()).rejects.toThrow('WhatsApp provider is not configured')

    expect(store.getState().error).toBe('WhatsApp provider is not configured')
    expect(store.getState().qrCode).toBeNull()
  })

  it('mirrors the live WhatsApp status onto the account', async () => {
    vi.mocked(api.fetchCurrentUser).mockResolvedValue(account as any)
    await store.getState().fetchAccount()
    vi.mocked(api.getWhatsappStatus).mockResolvedValue({ instanceName: 'user-1234abcd', status: 'CONNECTED' })

    await expect(store.getState().checkWhatsappStatus()).resolves.toBe('CONNECTED')

    expect(store.getState().whatsappStatus).toBe('CONNECTED')
    expect(store.getState().account?.whatsappInstanceName).toBe('user-1234abcd')
  })

  it('keeps the last known status and records the error when the status check fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.connectWhatsapp).mockResolvedValue({
      instanceName: 'user-1234abcd',
      qrcodeBase64: 'qr',
      status: 'PENDING',
    })
    await store.getState().connectWhatsapp()
    vi.mocked(api.getWhatsappStatus).mockRejectedValue(new Error('A network error occurred.'))

    await expect(store.getState().checkWhatsappStatus()).resolves.toBe('PENDING')

    expect(store.getState().error).toBe('A network error occurred.')
  })

  it('stores the user returned by setup completion', async () => {
    vi.mocked(api.completeSetup).mockResolvedValue({
      success: true,
      user: { ...account, setupCompleted: true } as any,
    })

    await store.getState().completeSetup()

    expect(store.getState().account?.setupCompleted).toBe(true)
  })
})
