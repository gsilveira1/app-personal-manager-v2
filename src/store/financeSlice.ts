import { type StateCreator } from 'zustand'

import { type Plan } from '../types'
import { type AppState } from './store'

export interface FinanceSlice {
  plans: Plan[]
  _setPlans: (plans: Plan[]) => void
  _addPlan: (plan: Plan) => void
  _updatePlan: (plan: Plan) => void
  _removePlan: (planId: string) => void
}

export const createFinanceSlice: StateCreator<AppState, [], [], FinanceSlice> = (set) => ({
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
