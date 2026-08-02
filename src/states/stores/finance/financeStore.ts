import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import { type Plan } from '../../../types'
import * as api from '../../../services/api/apiService'
import { createFinanceSlice, type FinanceSlice } from '../../slices/finance/financeSlice'

/**
 * Async API actions domain interface for financial plans management.
 */
export interface FinanceActions {
  /**
   * Creates a new financial plan on backend and state.
   * 
   * @param plan - Plan data omitting generated ID
   * @returns A promise resolving when plan creation completes
   */
  addPlan: (plan: Omit<Plan, 'id'>) => Promise<void>
  /**
   * Updates an existing financial plan.
   * 
   * @param id - Unique identifier of plan
   * @param plan - Partial plan properties to update
   * @returns A promise resolving when plan update completes
   */
  updatePlan: (id: string, plan: Partial<Plan>) => Promise<void>
  // Note: deletePlan in the global store (store.ts) overrides this with an
  // extra cross-domain step that unlinks affected clients from the plan.
  /**
   * Deletes a financial plan by ID.
   * 
   * @param id - Unique identifier of plan to delete
   * @returns A promise resolving when deletion completes
   */
  deletePlan: (id: string) => Promise<void>
}

/** Composite state type combining FinanceSlice and FinanceActions. */
export type FinanceStoreState = FinanceSlice & FinanceActions

/**
 * Single source of truth for all finance/plan async actions.
 * Consumed by both useFinanceStore (standalone) and useStore (global).
 * In the global store, deletePlan is overridden to also unlink clients.
 * 
 * @param set - Zustand state setter function
 * @param get - Zustand state getter function
 * @returns Object containing finance async action implementations
 */
export const createFinanceActions: StateCreator<FinanceStoreState, [], [], FinanceActions> = (set, get) => ({
  addPlan: async (planData) => {
    const newPlan = await api.createPlan(planData)
    get()._addPlan(newPlan)
  },

  updatePlan: async (id, updates) => {
    const updatedPlan = await api.updatePlan(id, updates)
    get()._updatePlan(updatedPlan)
  },

  deletePlan: async (id) => {
    await api.deletePlan(id)
    get()._removePlan(id)
  },
})

/**
 * Zustand hook for managing finance state and actions.
 * 
 * @example
 * const { plans, addPlan } = useFinanceStore();
 */
export const useFinanceStore = create<FinanceStoreState>()((...a) => ({
  ...createFinanceSlice(...a),
  ...createFinanceActions(...a),
}))

export type { FinanceSlice }
export { createFinanceSlice }
