import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import { type SystemFeature } from '../types'
import * as api from '../services/api/apiService'
import { createSystemFeatureSlice, type SystemFeatureSlice } from './slices/systemFeature/systemFeatureSlice'

export interface SystemFeatureActions {
  fetchSystemFeatures: () => Promise<void>
  addSystemFeature: (data: { key: string; name: string; description?: string }) => Promise<void>
  updateSystemFeature: (id: string, updates: Partial<SystemFeature>) => Promise<void>
  deleteSystemFeature: (id: string) => Promise<void>
}

export type SystemFeatureStoreState = SystemFeatureSlice & SystemFeatureActions

// Single source of truth for all system-feature async actions.
// Consumed by both useSystemFeatureStore (standalone) and useStore (global).
export const createSystemFeatureActions: StateCreator<SystemFeatureStoreState, [], [], SystemFeatureActions> = (set, get) => ({
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

export const useSystemFeatureStore = create<SystemFeatureStoreState>()((...a) => ({
  ...createSystemFeatureSlice(...a),
  ...createSystemFeatureActions(...a),
}))

export type { SystemFeatureSlice }
export { createSystemFeatureSlice }
