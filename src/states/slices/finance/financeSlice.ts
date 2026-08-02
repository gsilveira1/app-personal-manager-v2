import { type StateCreator } from 'zustand'

import { type Plan } from '../../../types'

/**
 * Slice managing financial plans state and synchronous mutations.
 */
export interface FinanceSlice {
  /** Array of active service/subscription plans. */
  plans: Plan[]
  /**
   * Sets the list of financial plans in state.
   * 
   * @param plans - List of Plan objects
   */
  _setPlans: (plans: Plan[]) => void
  /**
   * Appends a new financial plan to state.
   * 
   * @param plan - The new Plan object to add
   */
  _addPlan: (plan: Plan) => void
  /**
   * Updates an existing financial plan in state by matching ID.
   * 
   * @param plan - The updated Plan object
   */
  _updatePlan: (plan: Plan) => void
  /**
   * Removes a financial plan from state by ID.
   * 
   * @param planId - Unique ID of the plan to remove
   */
  _removePlan: (planId: string) => void
}

/**
 * Creates the finance slice state creator for Zustand store integration.
 * 
 * @param set - Zustand state setter function
 * @returns Initialized FinanceSlice state object and methods
 * @example
 * const slice = createFinanceSlice(set, get, storeApi);
 */
export const createFinanceSlice: StateCreator<FinanceSlice, [], [], FinanceSlice> = (set) => ({
  plans: [],
  _setPlans: (plans) => set({ plans }),
  _addPlan: (plan) => set((state) => ({ plans: [...state.plans, plan] })),
  _updatePlan: (plan) =>
    set((state) => ({
      plans: state.plans.map((p) => (p.id === plan.id ? plan : p)),
    })),
  _removePlan: (planId) =>
    set((state) => ({
      plans: state.plans.filter((p) => p.id !== planId),
    })),
})
