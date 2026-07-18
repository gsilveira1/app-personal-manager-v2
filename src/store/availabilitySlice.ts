import { type StateCreator } from 'zustand'

import { type AppState } from './store'
import { type WorkHoursConfig, type MaterializedBlock } from '../types'
import { getWorkHours } from '../services/apiService'

const DEFAULT_WORK_HOURS: WorkHoursConfig = {
  monday: { enabled: true, start: '07:00', end: '19:00' },
  tuesday: { enabled: true, start: '07:00', end: '19:00' },
  wednesday: { enabled: true, start: '07:00', end: '19:00' },
  thursday: { enabled: true, start: '07:00', end: '19:00' },
  friday: { enabled: true, start: '07:00', end: '19:00' },
  saturday: { enabled: true, start: '07:00', end: '19:00' },
  sunday: { enabled: false, start: '08:00', end: '12:00' },
  slotDurationMinutes: 60,
}

export interface AvailabilitySlice {
  workHours: WorkHoursConfig
  availabilityBlocks: MaterializedBlock[]
  _setWorkHours: (config: WorkHoursConfig) => void
  _setAvailabilityBlocks: (blocks: MaterializedBlock[]) => void
  hydrateWorkHours: () => Promise<void>
}

export const createAvailabilitySlice: StateCreator<AppState, [], [], AvailabilitySlice> = (set, get) => ({
  workHours: DEFAULT_WORK_HOURS,
  availabilityBlocks: [],

  _setWorkHours: (config) => set({ workHours: config }),
  _setAvailabilityBlocks: (blocks) => set({ availabilityBlocks: blocks }),

  hydrateWorkHours: async () => {
    try {
      const config = await getWorkHours()
      get()._setWorkHours(config)
    } catch {
      get()._setWorkHours(DEFAULT_WORK_HOURS)
    }
  },
})
