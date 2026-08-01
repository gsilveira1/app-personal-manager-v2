import { create } from 'zustand'

import { type Evaluation } from '../types'
import * as api from '../services/api/apiService'
import { createEvaluationSlice, type EvaluationSlice } from './slices/evaluation/evaluationSlice'

export interface EvaluationActions {
  addEvaluation: (evaluation: Omit<Evaluation, 'id'>) => Promise<void>
  updateEvaluation: (id: string, evaluation: Partial<Evaluation>) => Promise<void>
  deleteEvaluation: (id: string) => Promise<void>
}

export type EvaluationStoreState = EvaluationSlice & EvaluationActions

export const useEvaluationStore = create<EvaluationStoreState>()((...a) => ({
  ...createEvaluationSlice(...a),

  addEvaluation: async (evaluationData) => {
    const [, get] = [a[0], a[1]]
    const newEvaluation = await api.createEvaluation(evaluationData)
    get()._addEvaluation(newEvaluation)
  },

  updateEvaluation: async (id, updates) => {
    const [, get] = [a[0], a[1]]
    const updatedEvaluation = await api.updateEvaluation(id, updates)
    get()._updateEvaluation(updatedEvaluation)
  },

  deleteEvaluation: async (id) => {
    const [, get] = [a[0], a[1]]
    await api.deleteEvaluation(id)
    get()._removeEvaluation(id)
  },
}))

export type { EvaluationSlice }
export { createEvaluationSlice }
