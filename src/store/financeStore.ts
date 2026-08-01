import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import { type Plan } from '../types'
import * as api from '../services/api/apiService'
import { createFinanceSlice, type FinanceSlice } from './slices/finance/financeSlice'

export interface FinanceActions {
  addPlan: (plan: Omit<Plan, 'id'>) => Promise<void>
  updatePlan: (id: string, plan: Partial<Plan>) => Promise<void>
  // Note: deletePlan in the global store (store.ts) overrides this with an
  // extra cross-domain step that unlinks affected clients from the plan.
  deletePlan: (id: string) => Promise<void>
}

export type FinanceStoreState = FinanceSlice & FinanceActions

// Single source of truth for all finance/plan async actions.
// Consumed by both useFinanceStore (standalone) and useStore (global).
// In the global store, deletePlan is overridden to also unlink clients.
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

export const useFinanceStore = create<FinanceStoreState>()((...a) => ({
  ...createFinanceSlice(...a),
  ...createFinanceActions(...a),
}))

export type { FinanceSlice }
export { createFinanceSlice }
