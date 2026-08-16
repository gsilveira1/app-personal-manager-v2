import { type StateCreator } from 'zustand'

import { type SystemFeature } from '../../../types'

/**
 * Slice managing system feature flags and configurations state.
 */
export interface SystemFeatureSlice {
  /** Array of available system features and feature flags. */
  systemFeatures: SystemFeature[]
  /**
   * Replaces system feature flags list in state.
   *
   * @param features - List of SystemFeature objects
   */
  _setSystemFeatures: (features: SystemFeature[]) => void
  /**
   * Appends a new system feature configuration to state.
   *
   * @param feature - The new SystemFeature object
   */
  _addSystemFeature: (feature: SystemFeature) => void
  /**
   * Updates an existing system feature in state by matching ID.
   *
   * @param feature - The updated SystemFeature object
   */
  _updateSystemFeature: (feature: SystemFeature) => void
  /**
   * Removes a system feature from state by ID.
   *
   * @param id - Unique identifier of system feature to remove
   */
  _removeSystemFeature: (id: string) => void
}

/**
 * Creates the system feature slice state creator for Zustand store integration.
 *
 * @param set - Zustand state setter function
 * @returns Initialized SystemFeatureSlice state object and methods
 * @example
 * const slice = createSystemFeatureSlice(set, get, storeApi);
 */
export const createSystemFeatureSlice: StateCreator<SystemFeatureSlice, [], [], SystemFeatureSlice> = (set) => ({
  systemFeatures: [],

  _setSystemFeatures: (features) => set({ systemFeatures: features }),

  _addSystemFeature: (feature) => set((state) => ({ systemFeatures: [...state.systemFeatures, feature] })),

  _updateSystemFeature: (feature) =>
    set((state) => ({
      systemFeatures: state.systemFeatures.map((f) => (f.id === feature.id ? feature : f)),
    })),

  _removeSystemFeature: (id) =>
    set((state) => ({
      systemFeatures: state.systemFeatures.filter((f) => f.id !== id),
    })),
})
