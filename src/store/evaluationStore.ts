import { create } from 'zustand'

import { createEvaluationSlice, type EvaluationSlice } from './slices/evaluation/evaluationSlice'

export const useEvaluationStore = create<EvaluationSlice>()((...a) => ({
  ...createEvaluationSlice(...a),
}))

export type { EvaluationSlice }
export { createEvaluationSlice }
