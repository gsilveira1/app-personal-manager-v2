import { type Evaluation } from '../../types'
import apiClient from '../../utils/apiClient'

/**
 * Retrieves all physical evaluations.
 */
export const getEvaluations = async () => apiClient<Evaluation[]>('/evaluations')

/**
 * Creates a new physical evaluation.
 */
export const createEvaluation = async (evaluation: Omit<Evaluation, 'id'>) =>
  apiClient<Evaluation>('/evaluations', {
    method: 'POST',
    body: JSON.stringify(evaluation),
  })

/**
 * Updates an existing physical evaluation.
 */
export const updateEvaluation = async (id: string, updates: Partial<Evaluation>) =>
  apiClient<Evaluation>(`/evaluations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })

/**
 * Deletes a physical evaluation.
 */
export const deleteEvaluation = async (id: string) =>
  apiClient<void>(`/evaluations/${id}`, {
    method: 'DELETE',
  })
