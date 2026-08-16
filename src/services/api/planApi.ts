import { type Plan } from '../../types'
import apiClient from '../../utils/apiClient'

/**
 * Retrieves all subscription plans.
 */
export const getPlans = async () => apiClient<Plan[]>('/plans')

/**
 * Creates a new subscription plan.
 */
export const createPlan = async (plan: Omit<Plan, 'id'>) =>
  apiClient<Plan>('/plans', {
    method: 'POST',
    body: JSON.stringify(plan),
  })

/**
 * Updates an existing subscription plan.
 */
export const updatePlan = async (id: string, updates: Partial<Plan>) =>
  apiClient<Plan>(`/plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })

/**
 * Deletes a subscription plan.
 */
export const deletePlan = async (id: string) =>
  apiClient<void>(`/plans/${id}`, {
    method: 'DELETE',
  })
