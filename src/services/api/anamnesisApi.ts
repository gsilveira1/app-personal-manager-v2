import apiClient from '../../utils/apiClient'
import type { AnamnesisRecord } from '../../types'

export interface AnamnesisFormMetadata {
  studentName: string
  personalName: string
  theme: {
    primaryColor: string
    logoUrl: string | null
  }
}

export const getAnamnesisForm = async (token: string): Promise<AnamnesisFormMetadata> => {
  return apiClient<AnamnesisFormMetadata>(`/anamnesis/form?token=${encodeURIComponent(token)}`)
}

export const submitAnamnesis = async (data: any): Promise<{ message: string; id: string }> => {
  return apiClient<{ message: string; id: string }>('/anamnesis/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const getStudentAnamneses = async (clientId: string): Promise<AnamnesisRecord[]> => {
  return apiClient<AnamnesisRecord[]>(`/anamnesis/student/${clientId}`)
}

export interface ReassessmentRequestResult {
  message: string
  token: string
  link: string
  notification: { status: 'QUEUED'; jobId: string; scheduledDelayMs: number }
}

/**
 * Creates a pending anamnesis for the client and queues the WhatsApp message with its link.
 * Answers 503 when the notification queue is down.
 */
export const requestReassessment = async (clientId: string): Promise<ReassessmentRequestResult> => {
  return apiClient<ReassessmentRequestResult>(`/anamnesis/student/${clientId}/request-reassessment`, {
    method: 'POST',
  })
}
