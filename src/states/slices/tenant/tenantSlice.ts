import { type StateCreator } from 'zustand'
import { type Tenant, type WhatsappStatus } from '../../../types'
import * as api from '../../../services/api/apiService'

export interface TenantSlice {
  tenant: Tenant | null
  isLoading: boolean
  error: string | null
  qrCode: string | null
  whatsappStatus: WhatsappStatus | null

  fetchTenant: () => Promise<Tenant | null>
  updateBranding: (data: { logoUrl?: string; primaryColor?: string }) => Promise<Tenant>
  uploadLogo: (file: File) => Promise<string>
  connectWhatsapp: () => Promise<{
    instanceName: string
    qrcodeBase64: string
    status: WhatsappStatus
  }>
  checkWhatsappStatus: () => Promise<WhatsappStatus>
  disconnectWhatsapp: () => Promise<void>
  sendTestWhatsappMessage: (data: { phone: string; message: string }) => Promise<{ success: boolean; messageId: string }>
  completeSetup: () => Promise<void>
  setPrimaryColorPreview: (color: string) => void
}

export const createTenantSlice: StateCreator<TenantSlice, [], [], TenantSlice> = (set, get) => ({
  tenant: null,
  isLoading: false,
  error: null,
  qrCode: null,
  whatsappStatus: null,

  fetchTenant: async () => {
    set({ isLoading: true, error: null })
    try {
      const tenant = await api.getMyTenant()
      set({
        tenant,
        whatsappStatus: tenant.whatsappStatus || null,
        isLoading: false,
      })
      if (tenant.primaryColor) {
        document.documentElement.style.setProperty('--primary', tenant.primaryColor)
      }
      return tenant
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch tenant', isLoading: false })
      return null
    }
  },

  updateBranding: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await api.updateTenantBranding(data)
      set({ tenant: updated, isLoading: false })
      if (updated.primaryColor) {
        document.documentElement.style.setProperty('--primary', updated.primaryColor)
      }
      return updated
    } catch (err: any) {
      set({ error: err.message || 'Failed to update branding', isLoading: false })
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
    } catch (err: any) {
      set({ error: err.message || 'Failed to upload logo', isLoading: false })
      throw err
    }
  },

  connectWhatsapp: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.connectTenantWhatsapp()
      set({
        qrCode: response.qrcodeBase64,
        whatsappStatus: response.status,
        isLoading: false,
      })
      return response
    } catch (err: any) {
      set({ error: err.message || 'Failed to connect WhatsApp', isLoading: false })
      throw err
    }
  },

  checkWhatsappStatus: async () => {
    try {
      const response = await api.getTenantWhatsappStatus()
      set({ whatsappStatus: response.status })
      return response.status
    } catch (err: any) {
      console.error('Failed to check WhatsApp status', err)
      return 'PENDING'
    }
  },

  disconnectWhatsapp: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.disconnectTenantWhatsapp()
      set({
        whatsappStatus: response.status,
        qrCode: null,
        isLoading: false,
      })
    } catch (err: any) {
      set({ error: err.message || 'Failed to disconnect WhatsApp', isLoading: false })
      throw err
    }
  },

  sendTestWhatsappMessage: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.sendTestTenantWhatsappMessage(data)
      set({ isLoading: false })
      return response
    } catch (err: any) {
      set({ error: err.message || 'Failed to send test message', isLoading: false })
      throw err
    }
  },

  completeSetup: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.completeTenantSetup()
      set({
        tenant: response.tenant,
        isLoading: false,
      })
    } catch (err: any) {
      set({ error: err.message || 'Failed to complete setup', isLoading: false })
      throw err
    }
  },

  setPrimaryColorPreview: (color: string) => {
    document.documentElement.style.setProperty('--primary', color)
  },
})
