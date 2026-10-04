import apiClient from '../../utils/apiClient'
import { requestReassessment } from './anamnesisApi'

export type StudentLinkType = 'WORKOUT_SHEET' | 'ANAMNESIS'

/** `SendLinkResult` of `POST /clients/:id/magic-link/send`. */
export interface SendLinkResult {
  status: 'QUEUED'
  channel: 'WHATSAPP'
  jobId: string
  scheduledDelayMs: number
  link: string
  message: string
}

/** What the "send link" UI needs, whichever kind of link was sent. */
export interface StudentLinkDispatch {
  status: string
  message: string
  channel: string
  scheduledDelayMs: number
  link: string
}

/**
 * Creates the workout-portal magic link of a client without sending anything.
 */
export const getWorkoutMagicLink = async (clientId: string): Promise<{ token: string; url: string }> => apiClient<{ token: string; url: string }>(`/clients/${clientId}/magic-link`, { method: 'POST' })

/**
 * Builds the workout-portal link and queues it on WhatsApp. Answers 503 when the queue is down.
 */
export const sendWorkoutMagicLink = async (clientId: string): Promise<SendLinkResult> => apiClient<SendLinkResult>(`/clients/${clientId}/magic-link/send`, { method: 'POST' })

/**
 * Sends a student one of the two magic links. The old single `resend-link` route was split:
 * an anamnesis link is a reassessment request, a workout link is `magic-link/send`.
 */
export const resendStudentLink = async (clientId: string, type: StudentLinkType): Promise<StudentLinkDispatch> => {
  if (type === 'ANAMNESIS') {
    const res = await requestReassessment(clientId)
    return {
      status: res.notification.status,
      message: res.message,
      channel: 'WHATSAPP',
      scheduledDelayMs: res.notification.scheduledDelayMs,
      link: res.link,
    }
  }
  const res = await sendWorkoutMagicLink(clientId)
  return {
    status: res.status,
    message: res.message,
    channel: res.channel,
    scheduledDelayMs: res.scheduledDelayMs,
    link: res.link,
  }
}
