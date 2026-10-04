import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import * as api from '../../../services/api/apiService'
import { createPlanFeatureSlice, type PlanFeatureSlice } from '../../slices/planFeature/planFeatureSlice'

/**
 * Async API actions for the plan feature catalogue. The catalogue is read-only.
 */
export interface PlanFeatureActions {
  /**
   * Fetches the plan feature catalogue from backend and stores it in state.
   *
   * @returns A promise resolving when the catalogue is loaded
   */
  fetchPlanFeatures: () => Promise<void>
}

/** Composite state type combining PlanFeatureSlice and PlanFeatureActions. */
export type PlanFeatureStoreState = PlanFeatureSlice & PlanFeatureActions

/**
 * Single source of truth for the plan-feature async actions.
 * Consumed by both usePlanFeatureStore (standalone) and useStore (global).
 */
export const createPlanFeatureActions: StateCreator<PlanFeatureStoreState, [], [], PlanFeatureActions> = (_set, get) => ({
  fetchPlanFeatures: async () => {
    const features = await api.getPlanFeatures()
    get()._setPlanFeatures(features || [])
  },
})

/**
 * Zustand hook for the plan feature catalogue.
 *
 * @example
 * const { planFeatures, fetchPlanFeatures } = usePlanFeatureStore();
 */
export const usePlanFeatureStore = create<PlanFeatureStoreState>()((...a) => ({
  ...createPlanFeatureSlice(...a),
  ...createPlanFeatureActions(...a),
}))

export type { PlanFeatureSlice }
export { createPlanFeatureSlice }
