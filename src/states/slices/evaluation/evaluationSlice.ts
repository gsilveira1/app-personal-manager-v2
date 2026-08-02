import { type StateCreator } from 'zustand'

import { type Evaluation } from '../../../types'

/**
 * Slice managing physical evaluations state and synchronous mutations.
 */
export interface EvaluationSlice {
  /** List of client physical evaluations. */
  evaluations: Evaluation[]
  /**
   * Replaces the list of physical evaluations in state.
   * 
   * @param evaluations - Array of Evaluation objects
   */
  _setEvaluations: (evaluations: Evaluation[]) => void
  /**
   * Prepends a new physical evaluation to state.
   * 
   * @param evaluation - The newly created Evaluation record
   */
  _addEvaluation: (evaluation: Evaluation) => void
  /**
   * Updates an existing physical evaluation by ID in state.
   * 
   * @param evaluation - The updated Evaluation record
   */
  _updateEvaluation: (evaluation: Evaluation) => void
  /**
   * Removes a physical evaluation record by ID.
   * 
   * @param evaluationId - Unique identifier of evaluation to remove
   */
  _removeEvaluation: (evaluationId: string) => void
}

/**
 * Creates the evaluation slice state creator for Zustand store integration.
 * 
 * @param set - Zustand state setter function
 * @returns Initialized EvaluationSlice state object and methods
 * @example
 * const slice = createEvaluationSlice(set, get, storeApi);
 */
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
