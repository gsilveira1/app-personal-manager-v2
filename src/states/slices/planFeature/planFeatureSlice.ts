import { type StateCreator } from 'zustand'

import { type PlanFeatureDescriptor } from '../../../types'

/**
 * Slice holding the read-only catalogue of plan features.
 */
export interface PlanFeatureSlice {
  /** Features a plan can enable, as described by the API. */
  planFeatures: PlanFeatureDescriptor[]
  /**
   * Replaces the plan feature catalogue in state.
   *
   * @param features - List of plan feature descriptors
   */
  _setPlanFeatures: (features: PlanFeatureDescriptor[]) => void
}

/**
 * Creates the plan feature slice state creator for Zustand store integration.
 *
 * @param set - Zustand state setter function
 * @returns Initialized PlanFeatureSlice state object and methods
 */
export const createPlanFeatureSlice: StateCreator<PlanFeatureSlice, [], [], PlanFeatureSlice> = (set) => ({
  planFeatures: [],

  _setPlanFeatures: (features) => set({ planFeatures: features }),
})
