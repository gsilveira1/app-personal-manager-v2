import apiClient from '../../utils/apiClient'
import type { Paginated } from '../../types'

/**
 * `NotificationLogView`: the audit row of a finished notification job. A message
 * still waiting to be sent is not here; it is a `PendingNotification`.
 */
export interface NotificationLogItem {
  id: string
  userId: string
  clientId: string | null
  jobId: string | null
  recipientPhone: string
  templateType: string
  status: 'SENT' | 'FAILED' | 'CANCELLED'
  channel: 'WHATSAPP' | 'EMAIL'
  error: string | null
  createdAt: string
  updatedAt: string
}

/** `PendingNotificationView`: a job of the trainer still in the queue. */
export interface PendingNotification {
  jobId: string
  templateType: string
  recipientPhone: string
  clientId: string | null
  state: 'waiting' | 'delayed' | 'active'
  /** When a delayed job (held back by do-not-disturb or a retry) becomes due. */
  scheduledFor: string | null
  attemptsMade: number
  requestedAt: string
}

export interface MessageLogSummary {
  totalSent: number
  totalFailed: number
  totalCancelled: number
  totalPending: number
}

export type MessageLogPage = Paginated<NotificationLogItem> & { summary: MessageLogSummary }

export interface MessageLogParams {
  status?: 'ALL' | 'SENT' | 'FAILED' | 'CANCELLED'
  channel?: string
  search?: string
  page?: number
  limit?: number
}

/**
 * One page of the trainer's notification audit log, with the totals per outcome.
 */
export const getMessageLogs = async (params: MessageLogParams = {}): Promise<MessageLogPage> => {
  const query = new URLSearchParams()
  if (params.status) query.append('status', params.status)
  if (params.channel) query.append('channel', params.channel)
  if (params.search) query.append('search', params.search)
  if (params.page) query.append('page', params.page.toString())
  if (params.limit) query.append('limit', params.limit.toString())

  const qs = query.toString() ? `?${query.toString()}` : ''
  return apiClient<MessageLogPage>(`/messaging/logs${qs}`)
}

/**
 * The trainer's messages still in the queue (waiting, delayed or being sent).
 * Answers 503 when the queue is unreachable.
 */
export const getPendingMessages = async (): Promise<PendingNotification[]> => apiClient<PendingNotification[]>('/messaging/pending')

/**
 * Sends the delayed messages now, overriding the do-not-disturb window. Retries
 * and normal delivery are automatic; this only promotes what is being held back.
 */
export const flushPendingMessages = async (): Promise<{ promotedCount: number; message: string }> =>
  apiClient<{ promotedCount: number; message: string }>('/messaging/pending/flush', { method: 'POST' })

/**
 * Cancels a pending message by its job id. Answers 409 when it is already being sent.
 */
export const cancelPendingMessage = async (jobId: string): Promise<{ message: string; notification: NotificationLogItem }> =>
  apiClient<{ message: string; notification: NotificationLogItem }>(`/messaging/pending/${encodeURIComponent(jobId)}`, { method: 'DELETE' })

/**
 * Audit rows of the messages sent to one client, newest first.
 */
export const getClientMessageHistory = async (clientId: string): Promise<NotificationLogItem[]> => apiClient<NotificationLogItem[]>(`/clients/${clientId}/messages`)
