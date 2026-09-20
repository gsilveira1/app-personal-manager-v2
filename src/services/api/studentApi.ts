import apiClient, { API_BASE_URL } from '../../utils/apiClient'
import type { Client, ManualPayment, ActivityHeatmapData } from '../../types'

export interface StudentsResponse {
  items: Client[]
  total: number
  page: number
  totalPages: number
}

export const getStudents = async (params?: {
  page?: number
  limit?: number
  search?: string
  modality?: string
  status?: string
}): Promise<StudentsResponse> => {
  const query = new URLSearchParams()
  if (params?.page) query.append('page', params.page.toString())
  if (params?.limit) query.append('limit', params.limit.toString())
  if (params?.search) query.append('search', params.search)
  if (params?.modality) query.append('modality', params.modality)
  if (params?.status) query.append('status', params.status)

  const qs = query.toString() ? `?${query.toString()}` : ''
  return apiClient<StudentsResponse>(`/students${qs}`)
}

export const createStudent = async (data: Partial<Client>): Promise<Client> => {
  return apiClient<Client>('/students', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const recordManualPayment = async (
  id: string,
  data: { paymentType: string; validUntil: string; notes?: string; amount?: number },
): Promise<{ message: string; payment: ManualPayment; client: Client }> => {
  return apiClient<{ message: string; payment: ManualPayment; client: Client }>(`/students/${id}/manual-payment`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const updateStudentStatus = async (id: string, status: string): Promise<Client> => {
  return apiClient<Client>(`/students/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export const getActivityHeatmap = async (id: string, days: number = 30): Promise<ActivityHeatmapData> => {
  return apiClient<ActivityHeatmapData>(`/students/${id}/activity-heatmap?days=${days}`)
}

export const resendStudentLink = async (
  id: string,
  type: 'WORKOUT_SHEET' | 'ANAMNESIS',
): Promise<{ status: string; message: string; channel: string; scheduledDelayMs: number; link: string }> => {
  return apiClient(`/students/${id}/resend-link`, {
    method: 'POST',
    body: JSON.stringify({ type }),
  })
}

export const getWorkoutMagicLink = async (id: string): Promise<{ token: string; url: string }> => {
  return apiClient<{ token: string; url: string }>(`/students/${id}/magic-link`, {
    method: 'POST',
  })
}

export const getExportCsvUrl = (): string => `${API_BASE_URL}/students/export/csv`
