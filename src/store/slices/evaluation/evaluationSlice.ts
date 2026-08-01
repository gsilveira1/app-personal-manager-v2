import { type StateCreator } from 'zustand'

import { type Evaluation } from '../../../types'

export interface EvaluationSlice {
  evaluations: Evaluation[]
  _setEvaluations: (evaluations: Evaluation[]) => void
  _addEvaluation: (evaluation: Evaluation) => void
  _updateEvaluation: (evaluation: Evaluation) => void
  _removeEvaluation: (evaluationId: string) => void
}

export const createEvaluationSlice: StateCreator<EvaluationSlice, [], [], EvaluationSlice> = (set) => ({
  evaluations: [],
  _setEvaluations: (evaluations) => set({ evaluations }),
  _addEvaluation: (evaluation) => set((state) => ({ evaluations: [evaluation, ...state.evaluations] })),
  _updateEvaluation: (evaluation) =>
    set((state) => ({
      evaluations: state.evaluations.map((e) => (e.id === evaluation.id ? evaluation : e)),
    })),
  _removeEvaluation: (evaluationId: string) =>
    set((state) => ({
      evaluations: state.evaluations.filter((e) => e.id !== evaluationId),
    })),
})
