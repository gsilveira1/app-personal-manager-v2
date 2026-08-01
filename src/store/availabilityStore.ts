import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import { type AvailabilityBlock, type WorkHoursConfig } from '../types'
import * as api from '../services/api/apiService'
import { createAvailabilitySlice, type AvailabilitySlice } from './slices/availability/availabilitySlice'

export interface AvailabilityActions {
  updateWorkHours: (config: WorkHoursConfig) => Promise<void>
  fetchAvailabilityBlocks: (start: Date, end: Date) => Promise<void>
  addAvailabilityBlock: (data: Omit<AvailabilityBlock, 'id'>) => Promise<void>
  updateAvailabilityBlock: (id: string, data: Partial<AvailabilityBlock>) => Promise<void>
  deleteAvailabilityBlock: (id: string) => Promise<void>
}

export type AvailabilityStoreState = AvailabilitySlice & AvailabilityActions

// Single source of truth for all availability async actions.
// Consumed by both useAvailabilityStore (standalone) and useStore (global).
export const createAvailabilityActions: StateCreator<AvailabilityStoreState, [], [], AvailabilityActions> = (set, get) => ({
  updateWorkHours: async (config) => {
    const result = await api.updateWorkHours(config)
    get()._setWorkHours(result)
  },

  fetchAvailabilityBlocks: async (start, end) => {
    const blocks = await api.getAvailabilityBlocks(start, end)
    get()._setAvailabilityBlocks(blocks || [])
  },

  addAvailabilityBlock: async (data) => {
    await api.createAvailabilityBlock(data)
  },

  updateAvailabilityBlock: async (id, data) => {
    await api.updateAvailabilityBlock(id, data)
  },

  deleteAvailabilityBlock: async (id) => {
    await api.deleteAvailabilityBlock(id)
  },
})

export const useAvailabilityStore = create<AvailabilityStoreState>()((...a) => ({
  ...createAvailabilitySlice(...a),
  ...createAvailabilityActions(...a),
}))

export type { AvailabilitySlice }
export { createAvailabilitySlice }
