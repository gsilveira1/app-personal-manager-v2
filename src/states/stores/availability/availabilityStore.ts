import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import { type AvailabilityBlock, type WorkHoursConfig } from '../../../types'
import * as api from '../../../services/api/apiService'
import { createAvailabilitySlice, type AvailabilitySlice } from '../../slices/availability/availabilitySlice'

/**
 * Async API actions domain interface for managing availability and work hours.
 */
export interface AvailabilityActions {
  /**
   * Updates working hours configuration on backend and state.
   *
   * @param config - New WorkHoursConfig object
   * @returns A promise resolving when update completes
   * @example
   * await updateWorkHours(newConfig);
   */
  updateWorkHours: (config: WorkHoursConfig) => Promise<void>
  /**
   * Fetches availability blocks for a given date range.
   *
   * @param start - Start Date of range
   * @param end - End Date of range
   * @returns A promise resolving when blocks are fetched and set in state
   * @example
   * await fetchAvailabilityBlocks(startDate, endDate);
   */
  fetchAvailabilityBlocks: (start: Date, end: Date) => Promise<void>
  /**
   * Creates a new availability block.
   *
   * @param data - Block details omitting ID
   * @returns A promise resolving when creation completes
   */
  addAvailabilityBlock: (data: Omit<AvailabilityBlock, 'id'>) => Promise<void>
  /**
   * Updates an existing availability block.
   *
   * @param id - Unique identifier of the block
   * @param data - Partial block properties to update
   * @returns A promise resolving when update completes
   */
  updateAvailabilityBlock: (id: string, data: Partial<AvailabilityBlock>) => Promise<void>
  /**
   * Deletes an availability block by ID.
   *
   * @param id - Unique identifier of block to delete
   * @returns A promise resolving when deletion completes
   */
  deleteAvailabilityBlock: (id: string) => Promise<void>
}

/** Composite state type combining AvailabilitySlice and AvailabilityActions. */
export type AvailabilityStoreState = AvailabilitySlice & AvailabilityActions

/**
 * Single source of truth for all availability async actions.
 * Consumed by both useAvailabilityStore (standalone) and useStore (global).
 *
 * @param set - Zustand setter function
 * @param get - Zustand getter function
 * @returns Object containing availability async action implementations
 */
export const createAvailabilityActions: StateCreator<AvailabilityStoreState, [], [], AvailabilityActions> = (_set, get) => ({
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

/**
 * Zustand hook for managing availability state and actions.
 *
 * @example
 * const { workHours, updateWorkHours } = useAvailabilityStore();
 */
export const useAvailabilityStore = create<AvailabilityStoreState>()((...a) => ({
  ...createAvailabilitySlice(...a),
  ...createAvailabilityActions(...a),
}))

export type { AvailabilitySlice }
export { createAvailabilitySlice }
