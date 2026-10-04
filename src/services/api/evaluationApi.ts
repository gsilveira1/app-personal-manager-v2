import { type Evaluation } from '../../types'
import apiClient from '../../utils/apiClient'

/**
 * `CreateEvaluationBody`: the properties `POST /evaluations` accepts. Everything else
 * on the view model (id, timestamps, the embedded client, values the client derives
 * for display such as `idealWeight`) is read-only and rejected by the API.
 */
const BODY_KEYS = ['clientId', 'date', 'weight', 'height', 'bodyFatPercentage', 'leanMass', 'fatMass', 'bodyDensity', 'protocol', 'equation', 'notes', 'perimeters', 'skinfolds'] as const

export type EvaluationBody = Partial<Pick<Evaluation, (typeof BODY_KEYS)[number]>>

/**
 * View model → request body. `forUpdate` drops `clientId`, which `PATCH` does not accept.
 */
export const toEvaluationBody = (evaluation: Partial<Evaluation>, forUpdate = false): EvaluationBody => {
  const body: Record<string, unknown> = {}
  for (const key of BODY_KEYS) {
    if (forUpdate && key === 'clientId') continue
    const value = evaluation[key]
    if (value !== undefined && value !== null) body[key] = value
  }
  return body as EvaluationBody
}

/**
 * Retrieves all physical evaluations (newest first; soft-deleted clients excluded).
 */
export const getEvaluations = async () => apiClient<Evaluation[]>('/evaluations')

/**
 * Creates a new physical evaluation.
 */
export const createEvaluation = async (evaluation: Omit<Evaluation, 'id'>) =>
  apiClient<Evaluation>('/evaluations', {
    method: 'POST',
    body: JSON.stringify(toEvaluationBody(evaluation)),
  })

/**
 * Updates an existing physical evaluation.
 */
export const updateEvaluation = async (id: string, updates: Partial<Evaluation>) =>
  apiClient<Evaluation>(`/evaluations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toEvaluationBody(updates, true)),
  })

/**
 * Deletes a physical evaluation.
 */
export const deleteEvaluation = async (id: string) =>
  apiClient<void>(`/evaluations/${id}`, {
    method: 'DELETE',
  })
