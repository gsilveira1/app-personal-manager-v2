import apiClient from '../../utils/apiClient'
import type { ExerciseCatalogItem } from '../../types'

export const getExercises = async (params?: {
  search?: string
  bodyPart?: string
  equipment?: string
}): Promise<ExerciseCatalogItem[]> => {
  const query = new URLSearchParams()
  if (params?.search) query.append('search', params.search)
  if (params?.bodyPart) query.append('bodyPart', params.bodyPart)
  if (params?.equipment) query.append('equipment', params.equipment)

  const qs = query.toString() ? `?${query.toString()}` : ''
  return apiClient<ExerciseCatalogItem[]>(`/exercises${qs}`)
}

export const createExercise = async (data: Partial<ExerciseCatalogItem>): Promise<ExerciseCatalogItem> => {
  return apiClient<ExerciseCatalogItem>('/exercises', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
