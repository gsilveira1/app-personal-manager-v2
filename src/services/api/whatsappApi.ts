import { type WhatsappStatus } from '../../types'
import apiClient from '../../utils/apiClient'

export interface WhatsappConnectPayload {
  instanceName: string
  qrcodeBase64: string
  status: WhatsappStatus
}

export interface WhatsappStatusPayload {
  instanceName: string | null
  status: WhatsappStatus
}

export interface WhatsappDisconnectPayload {
  success: boolean
  status: WhatsappStatus
  instanceName: string | null
}

/**
 * Creates (or reuses) the trainer's WhatsApp instance and returns the QR code to scan.
 * Answers 503 when the provider is not configured and 502 when the provider fails.
 */
export const connectWhatsapp = async (): Promise<WhatsappConnectPayload> => apiClient<WhatsappConnectPayload>('/whatsapp/connect', { method: 'POST' })

/**
 * Gets the current status of the trainer's WhatsApp connection.
 */
export const getWhatsappStatus = async (): Promise<WhatsappStatusPayload> => apiClient<WhatsappStatusPayload>('/whatsapp/status')

/**
 * Disconnects the trainer's WhatsApp instance.
 */
export const disconnectWhatsapp = async (): Promise<WhatsappDisconnectPayload> => apiClient<WhatsappDisconnectPayload>('/whatsapp/disconnect', { method: 'POST' })

/**
 * Sends a test WhatsApp message to verify the connection (direct send, not queued).
 */
export const sendWhatsappTestMessage = async (data: { phone: string; message: string }): Promise<{ success: boolean; messageId: string }> =>
  apiClient<{ success: boolean; messageId: string }>('/whatsapp/test-message', {
    method: 'POST',
    body: JSON.stringify(data),
  })
