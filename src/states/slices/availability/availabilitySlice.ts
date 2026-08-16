import { type StateCreator } from 'zustand'

import { type WorkHoursConfig, type MaterializedBlock } from '../../../types'
import { getWorkHours } from '../../../services/api/apiService'

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

/**
 * Slice managing working hours configuration and availability blocks state.
 */
export interface AvailabilitySlice {
  /** Configured working hours per day of the week and slot duration. */
  workHours: WorkHoursConfig
  /** Materialized unavailability/availability blocks. */
  availabilityBlocks: MaterializedBlock[]
  /**
   * Internal mutator to update working hours in state.
   *
   * @param config - The updated WorkHoursConfig object
   */
  _setWorkHours: (config: WorkHoursConfig) => void
  /**
   * Internal mutator to set materialized availability blocks in state.
   *
   * @param blocks - List of materialized availability blocks
   */
  _setAvailabilityBlocks: (blocks: MaterializedBlock[]) => void
  /**
   * Hydrates working hours configuration from the server.
   *
   * @returns A promise resolving when hydration is complete
   * @example
   * await hydrateWorkHours();
   */
  hydrateWorkHours: () => Promise<void>
}

/**
 * Creates the availability slice state creator for Zustand.
 *
 * @param set - Zustand state setter function
 * @param get - Zustand state getter function
 * @returns Initialized AvailabilitySlice state object and methods
 * @example
 * const slice = createAvailabilitySlice(set, get, storeApi);
 */
export const createAvailabilitySlice: StateCreator<AvailabilitySlice, [], [], AvailabilitySlice> = (set, get) => ({
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
