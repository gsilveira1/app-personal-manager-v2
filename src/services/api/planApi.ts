import { type Plan } from '../../types'
import apiClient from '../../utils/apiClient'

/** `CreatePlanBody`: the only properties `POST /plans` and `PATCH /plans/:id` accept. */
const BODY_KEYS = ['type', 'name', 'sessionsPerWeek', 'durationMinutes', 'price', 'active', 'features'] as const

export type PlanBody = Partial<Pick<Plan, (typeof BODY_KEYS)[number]>>

/**
 * View model → request body. The API rejects unknown properties, so read-only
 * fields (id, userId, timestamps, `_count`) and empty values are left out.
 */
export const toPlanBody = (plan: Partial<Plan>): PlanBody => {
  const body: Record<string, unknown> = {}
  for (const key of BODY_KEYS) {
    const value = plan[key]
    if (value !== undefined && value !== null) body[key] = value
  }
  return body as PlanBody
}

/** `PlanView` as sent by the API: `durationMinutes` is null on CONSULTORIA plans. */
type PlanWire = Omit<Plan, 'durationMinutes'> & { durationMinutes?: number | null }

const toPlan = (wire: PlanWire): Plan => ({ ...wire, durationMinutes: wire.durationMinutes ?? undefined })

/**
 * Retrieves all subscription plans.
 */
export const getPlans = async () => (await apiClient<PlanWire[]>('/plans')).map(toPlan)

/**
 * Creates a new subscription plan.
 */
export const createPlan = async (plan: Omit<Plan, 'id'>) =>
  toPlan(
    await apiClient<PlanWire>('/plans', {
      method: 'POST',
      body: JSON.stringify(toPlanBody(plan)),
    })
  )

/**
 * Updates an existing subscription plan.
 */
export const updatePlan = async (id: string, updates: Partial<Plan>) =>
  toPlan(
    await apiClient<PlanWire>(`/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(toPlanBody(updates)),
    })
  )

/**
 * Deletes a subscription plan. The API answers with the deleted plan.
 */
export const deletePlan = async (id: string) =>
  apiClient<PlanWire>(`/plans/${id}`, {
    method: 'DELETE',
  })
