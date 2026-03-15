import { type StateCreator } from 'zustand'

import { type AppState } from './store'
import { type SystemFeature } from '../types'

export interface SystemFeatureSlice {
  systemFeatures: SystemFeature[]
  _setSystemFeatures: (features: SystemFeature[]) => void
  _addSystemFeature: (feature: SystemFeature) => void
  _updateSystemFeature: (feature: SystemFeature) => void
  _removeSystemFeature: (id: string) => void
}

export const createSystemFeatureSlice: StateCreator<AppState, [], [], SystemFeatureSlice> = (set) => ({
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
