import { create } from 'zustand'

import { type Plan } from '../types'
import * as api from '../services/api/apiService'
import { createFinanceSlice, type FinanceSlice } from './slices/finance/financeSlice'
import { type ClientSlice } from './slices/clients/clientSlice'

export interface FinanceActions {
  addPlan: (plan: Omit<Plan, 'id'>) => Promise<void>
  updatePlan: (id: string, plan: Partial<Plan>) => Promise<void>
  // deletePlan also unlinks affected clients from the plan
  deletePlan: (id: string, getClients: () => ClientSlice) => Promise<void>
}

export type FinanceStoreState = FinanceSlice & FinanceActions

export const useFinanceStore = create<FinanceStoreState>()((...a) => ({
  ...createFinanceSlice(...a),

  addPlan: async (planData) => {
    const [, get] = [a[0], a[1]]
    const newPlan = await api.createPlan(planData)
    get()._addPlan(newPlan)
  },

  updatePlan: async (id, updates) => {
    const [, get] = [a[0], a[1]]
    const updatedPlan = await api.updatePlan(id, updates)
    get()._updatePlan(updatedPlan)
  },

  deletePlan: async (id, getClients) => {
    const [set, get] = [a[0], a[1]]
    await api.deletePlan(id)
    get()._removePlan(id)
    // Caller (global store) is responsible for updating client references
  },
}))

export type { FinanceSlice }
export { createFinanceSlice }
