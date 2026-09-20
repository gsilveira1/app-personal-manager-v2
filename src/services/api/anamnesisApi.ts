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

export const requestReassessment = async (
  clientId: string,
): Promise<{ message: string; token: string; link: string }> => {
  return apiClient<{ message: string; token: string; link: string }>(
    `/anamnesis/student/${clientId}/request-reassessment`,
    {
      method: 'POST',
    },
  )
}
