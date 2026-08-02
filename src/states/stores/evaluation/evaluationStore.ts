import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import { type Evaluation } from '../../../types'
import * as api from '../../../services/api/apiService'
import { createEvaluationSlice, type EvaluationSlice } from '../../slices/evaluation/evaluationSlice'

/**
 * Async API actions domain interface for physical evaluations management.
 */
export interface EvaluationActions {
  /**
   * Creates a new physical evaluation record on backend and state.
   * 
   * @param evaluation - Evaluation data omitting generated ID
   * @returns A promise resolving when evaluation creation completes
   */
  addEvaluation: (evaluation: Omit<Evaluation, 'id'>) => Promise<void>
  /**
   * Updates an existing physical evaluation record.
   * 
   * @param id - Unique identifier of evaluation record
   * @param evaluation - Partial evaluation properties to update
   * @returns A promise resolving when evaluation update completes
   */
  updateEvaluation: (id: string, evaluation: Partial<Evaluation>) => Promise<void>
  /**
   * Deletes a physical evaluation record by ID.
   * 
   * @param id - Unique identifier of evaluation record to delete
   * @returns A promise resolving when deletion completes
   */
  deleteEvaluation: (id: string) => Promise<void>
}

/** Composite state type combining EvaluationSlice and EvaluationActions. */
export type EvaluationStoreState = EvaluationSlice & EvaluationActions

/**
 * Single source of truth for all evaluation async actions.
 * Consumed by both useEvaluationStore (standalone) and useStore (global).
 * 
 * @param set - Zustand setter function
 * @param get - Zustand getter function
 * @returns Object containing evaluation async action implementations
 */
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

/**
 * Zustand hook for managing evaluation state and actions.
 * 
 * @example
 * const { evaluations, addEvaluation } = useEvaluationStore();
 */
export const useEvaluationStore = create<EvaluationStoreState>()((...a) => ({
  ...createEvaluationSlice(...a),
  ...createEvaluationActions(...a),
}))

export type { EvaluationSlice }
export { createEvaluationSlice }
