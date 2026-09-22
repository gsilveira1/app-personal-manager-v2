import apiClient from '../../utils/apiClient'

export interface NotificationLogItem {
  id: string
  tenantId?: string | null
  recipientPhone: string
  templateType: string
  status: 'QUEUED' | 'SENT' | 'FAILED' | 'CANCELLED'
  channel: 'WHATSAPP' | 'EMAIL'
  error?: string | null
  createdAt: string
  updatedAt: string
}

export interface QueueSummary {
  totalQueued: number
  totalSent: number
  totalFailed: number
  totalCancelled: number
}

export interface QueueResponse {
  items: NotificationLogItem[]
  total: number
  page: number
  totalPages: number
  summary: QueueSummary
}

export const getTenantQueue = async (params?: {
  status?: string
  channel?: string
  search?: string
  page?: number
  limit?: number
}): Promise<QueueResponse> => {
  const query = new URLSearchParams()
  if (params?.status) query.append('status', params.status)
  if (params?.channel) query.append('channel', params.channel)
  if (params?.search) query.append('search', params.search)
  if (params?.page) query.append('page', params.page.toString())
  if (params?.limit) query.append('limit', params.limit.toString())

  const qs = query.toString() ? `?${query.toString()}` : ''
  return apiClient<QueueResponse>(`/messaging/queue${qs}`)
}

export const getClientMessageHistory = async (clientId: string): Promise<NotificationLogItem[]> => {
  return apiClient<NotificationLogItem[]>(`/students/${clientId}/messages`)
}

export const retryMessage = async (logId: string): Promise<{ message: string; notification: NotificationLogItem }> => {
  return apiClient<{ message: string; notification: NotificationLogItem }>(`/messaging/queue/${logId}/retry`, {
    method: 'POST',
  })
}

export const cancelMessage = async (logId: string): Promise<{ message: string; notification: NotificationLogItem }> => {
  return apiClient<{ message: string; notification: NotificationLogItem }>(`/messaging/queue/${logId}`, {
    method: 'DELETE',
  })
}

export const resendStudentLink = async (
  clientId: string,
  type: 'WORKOUT_SHEET' | 'ANAMNESIS'
): Promise<{ status: string; message: string; channel: string; scheduledDelayMs: number; link: string }> => {
  return apiClient(`/students/${clientId}/resend-link`, {
    method: 'POST',
    body: JSON.stringify({ type }),
  })
}

export const processPendingQueue = async (
  force: boolean = true
): Promise<{
  processedCount: number
  successCount: number
  failedCount: number
  delayedCount: number
  message: string
}> => {
  return apiClient('/messaging/queue/process', {
    method: 'POST',
    body: JSON.stringify({ force }),
  })
}

