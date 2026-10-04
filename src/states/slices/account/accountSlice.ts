import { type StateCreator } from 'zustand'
import { type User, type WhatsappStatus } from '../../../types'
import * as api from '../../../services/api/apiService'

const applyPrimaryColor = (color: string | null | undefined) => {
  if (color) document.documentElement.style.setProperty('--primary', color)
}

const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

/**
 * Trainer account concerns that used to live on a tenant: branding, the WhatsApp
 * connection and the setup wizard. They are all fields of the user now.
 */
export interface AccountSlice {
  account: User | null
  isLoading: boolean
  error: string | null
  qrCode: string | null
  whatsappStatus: WhatsappStatus | null

  fetchAccount: () => Promise<User | null>
  updateBranding: (data: { logoUrl?: string; primaryColor?: string }) => Promise<User>
  uploadLogo: (file: File) => Promise<string>
  connectWhatsapp: () => Promise<{
    instanceName: string
    qrcodeBase64: string
    status: WhatsappStatus
  }>
  /** Resolves to the live status, or to the last known one when the check fails (the failure is kept in `error`). */
  checkWhatsappStatus: () => Promise<WhatsappStatus | null>
  disconnectWhatsapp: () => Promise<void>
  sendTestWhatsappMessage: (data: { phone: string; message: string }) => Promise<{ success: boolean; messageId: string }>
  completeSetup: () => Promise<void>
  setPrimaryColorPreview: (color: string) => void
}

export const createAccountSlice: StateCreator<AccountSlice, [], [], AccountSlice> = (set, get) => ({
  account: null,
  isLoading: false,
  error: null,
  qrCode: null,
  whatsappStatus: null,

  fetchAccount: async () => {
    set({ isLoading: true, error: null })
    try {
      const account = await api.fetchCurrentUser()
      set({ account, whatsappStatus: account.whatsappStatus ?? null, isLoading: false })
      applyPrimaryColor(account.primaryColor)
      return account
    } catch (err) {
      console.error('Failed to fetch account', err)
      set({ error: messageOf(err, 'Failed to fetch account'), isLoading: false })
      return null
    }
  },

  updateBranding: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await api.updateBranding(data)
      set({ account: updated, isLoading: false })
      applyPrimaryColor(updated.primaryColor)
      return updated
    } catch (err) {
      set({ error: messageOf(err, 'Failed to update branding'), isLoading: false })
      throw err
    }
  },

  uploadLogo: async (file: File) => {
    set({ isLoading: true, error: null })
    try {
      const { uploadUrl, publicUrl } = await api.getStoragePresignedUrl(file.name, file.type, 'logos')
      await api.uploadFileToR2PresignedUrl(uploadUrl, file)
      await get().updateBranding({ logoUrl: publicUrl })
      set({ isLoading: false })
      return publicUrl
    } catch (err) {
      set({ error: messageOf(err, 'Failed to upload logo'), isLoading: false })
      throw err
    }
  },

  connectWhatsapp: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.connectWhatsapp()
      set({ qrCode: response.qrcodeBase64, whatsappStatus: response.status, isLoading: false })
      return response
    } catch (err) {
      set({ error: messageOf(err, 'Failed to connect WhatsApp'), isLoading: false })
      throw err
    }
  },

  checkWhatsappStatus: async () => {
    try {
      const response = await api.getWhatsappStatus()
      set((state) => ({
        whatsappStatus: response.status,
        account: state.account ? { ...state.account, whatsappStatus: response.status, whatsappInstanceName: response.instanceName } : state.account,
      }))
      return response.status
    } catch (err) {
      console.error('Failed to check WhatsApp status', err)
      set({ error: messageOf(err, 'Failed to check WhatsApp status') })
      return get().whatsappStatus
    }
  },

  disconnectWhatsapp: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.disconnectWhatsapp()
      set({ whatsappStatus: response.status, qrCode: null, isLoading: false })
    } catch (err) {
      set({ error: messageOf(err, 'Failed to disconnect WhatsApp'), isLoading: false })
      throw err
    }
  },

  sendTestWhatsappMessage: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.sendWhatsappTestMessage(data)
      set({ isLoading: false })
      return response
    } catch (err) {
      set({ error: messageOf(err, 'Failed to send test message'), isLoading: false })
      throw err
    }
  },

  completeSetup: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.completeSetup()
      set({ account: response.user, isLoading: false })
    } catch (err) {
      set({ error: messageOf(err, 'Failed to complete setup'), isLoading: false })
      throw err
    }
  },

  setPrimaryColorPreview: (color: string) => {
    document.documentElement.style.setProperty('--primary', color)
  },
})
