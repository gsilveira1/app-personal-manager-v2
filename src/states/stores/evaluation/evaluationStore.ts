import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import { type Evaluation } from '../../../types'
import * as api from '../../../services/api/apiService'
import { createEvaluationSlice, type EvaluationSlice } from '../../slices/evaluation/evaluationSlice'

export interface EvaluationActions {
  addEvaluation: (evaluation: Omit<Evaluation, 'id'>) => Promise<void>
  updateEvaluation: (id: string, evaluation: Partial<Evaluation>) => Promise<void>
  deleteEvaluation: (id: string) => Promise<void>
}

export type EvaluationStoreState = EvaluationSlice & EvaluationActions

// Single source of truth for all evaluation async actions.
// Consumed by both useEvaluationStore (standalone) and useStore (global).
export const createEvaluationActions: StateCreator<EvaluationStoreState, [], [], EvaluationActions> = (set, get) => ({
  addEvaluation: async (evaluationData) => {
    const newEvaluation = await api.createEvaluation(evaluationData)
    get()._addEvaluation(newEvaluation)
  },

  updateEvaluation: async (id, updates) => {
    const updatedEvaluation = await api.updateEvaluation(id, updates)
    get()._updateEvaluation(updatedEvaluation)
  },

  deleteEvaluation: async (id) => {
    await api.deleteEvaluation(id)
    get()._removeEvaluation(id)
  },
})

export const useEvaluationStore = create<EvaluationStoreState>()((...a) => ({
  ...createEvaluationSlice(...a),
  ...createEvaluationActions(...a),
}))

export type { EvaluationSlice }
export { createEvaluationSlice }
