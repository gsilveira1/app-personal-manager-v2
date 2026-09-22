import { type Tenant, type WhatsappStatus } from '../../types'
import apiClient from '../../utils/apiClient'

export interface WhatsappConnectPayload {
  instanceName: string
  qrcodeBase64: string
  status: WhatsappStatus
}

export interface WhatsappStatusPayload {
  instanceName?: string | null
  status: WhatsappStatus
}

export interface CompleteSetupPayload {
  success: boolean
  tenant: Tenant
}

/**
 * Gets the current user's tenant details.
 */
export const getMyTenant = async (): Promise<Tenant> => {
  return await apiClient<Tenant>('/tenant/me')
}

/**
 * Updates tenant branding (logo URL, primary brand color).
 */
export const updateTenantBranding = async (data: { logoUrl?: string; primaryColor?: string }): Promise<Tenant> => {
  return await apiClient<Tenant>('/tenant/branding', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * Connects WhatsApp instance and retrieves QR code payload.
 */
export const connectTenantWhatsapp = async (): Promise<WhatsappConnectPayload> => {
  return await apiClient<WhatsappConnectPayload>('/tenant/whatsapp/connect', {
    method: 'POST',
  })
}

/**
 * Polls or gets the current status of the tenant's WhatsApp connection.
 */
export const getTenantWhatsappStatus = async (): Promise<WhatsappStatusPayload> => {
  return await apiClient<WhatsappStatusPayload>('/tenant/whatsapp/status')
}

/**
 * Completes the tenant setup wizard and unlocks dashboard access.
 */
export const completeTenantSetup = async (): Promise<CompleteSetupPayload> => {
  return await apiClient<CompleteSetupPayload>('/tenant/setup/complete', {
    method: 'POST',
  })
}

/**
 * Disconnects WhatsApp instance on Evolution API.
 */
export const disconnectTenantWhatsapp = async (): Promise<{ success: boolean; status: WhatsappStatus; instanceName?: string }> => {
  return await apiClient<{ success: boolean; status: WhatsappStatus; instanceName?: string }>('/tenant/whatsapp/disconnect', {
    method: 'POST',
  })
}

/**
 * Sends a test WhatsApp message to verify connection.
 */
export const sendTestTenantWhatsappMessage = async (data: { phone: string; message: string }): Promise<{ success: boolean; messageId: string }> => {
  return await apiClient<{ success: boolean; messageId: string }>('/tenant/whatsapp/test-message', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

