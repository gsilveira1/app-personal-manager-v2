import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import { type SystemFeature } from '../../../types'
import * as api from '../../../services/api/apiService'
import { createSystemFeatureSlice, type SystemFeatureSlice } from '../../slices/systemFeature/systemFeatureSlice'

/**
 * Async API actions domain interface for system feature flags management.
 */
export interface SystemFeatureActions {
  /**
   * Fetches active system features from backend and stores in state.
   *
   * @returns A promise resolving when system features are loaded
   */
  fetchSystemFeatures: () => Promise<void>
  /**
   * Creates a new system feature flag configuration.
   *
   * @param data - Key, name, and optional description of feature flag
   * @returns A promise resolving when creation completes
   */
  addSystemFeature: (data: { key: string; name: string; description?: string }) => Promise<void>
  /**
   * Updates an existing system feature flag.
   *
   * @param id - Unique identifier of feature flag
   * @param updates - Partial properties to update
   * @returns A promise resolving when update completes
   */
  updateSystemFeature: (id: string, updates: Partial<SystemFeature>) => Promise<void>
  /**
   * Deletes a system feature flag by ID.
   *
   * @param id - Unique identifier of feature flag to delete
   * @returns A promise resolving when deletion completes
   */
  deleteSystemFeature: (id: string) => Promise<void>
}

/** Composite state type combining SystemFeatureSlice and SystemFeatureActions. */
export type SystemFeatureStoreState = SystemFeatureSlice & SystemFeatureActions

/**
 * Single source of truth for all system-feature async actions.
 * Consumed by both useSystemFeatureStore (standalone) and useStore (global).
 *
 * @param set - Zustand state setter function
 * @param get - Zustand state getter function
 * @returns Object containing system feature async action implementations
 */
export const createSystemFeatureActions: StateCreator<SystemFeatureStoreState, [], [], SystemFeatureActions> = (_set, get) => ({
  fetchSystemFeatures: async () => {
    const features = await api.getActiveSystemFeatures()
    get()._setSystemFeatures(features || [])
  },

  addSystemFeature: async (data) => {
    const feature = await api.createSystemFeature(data)
    get()._addSystemFeature(feature)
  },

  updateSystemFeature: async (id, updates) => {
    const feature = await api.updateSystemFeature(id, updates)
    get()._updateSystemFeature(feature)
  },

  deleteSystemFeature: async (id) => {
    await api.deleteSystemFeature(id)
    get()._removeSystemFeature(id)
  },
})

/**
 * Zustand hook for managing system feature state and actions.
 *
 * @example
 * const { systemFeatures, fetchSystemFeatures } = useSystemFeatureStore();
 */
export const useSystemFeatureStore = create<SystemFeatureStoreState>()((...a) => ({
  ...createSystemFeatureSlice(...a),
  ...createSystemFeatureActions(...a),
}))

export type { SystemFeatureSlice }
export { createSystemFeatureSlice }
