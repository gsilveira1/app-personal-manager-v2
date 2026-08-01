// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { create } from 'zustand'

import { createAvailabilitySlice, type AvailabilitySlice } from './availabilitySlice'

vi.mock('../../../services/api/apiService', () => ({
  getWorkHours: vi.fn(),
}))

import { getWorkHours } from '../../../services/api/apiService'

const mockGetWorkHours = vi.mocked(getWorkHours)

const createTestStore = () => create<AvailabilitySlice>()((...a) => ({ ...createAvailabilitySlice(...a) }))

describe('availabilitySlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
    vi.clearAllMocks()
  })

  it('should initialize with default workHours and empty availabilityBlocks', () => {
    expect(store.getState().workHours.monday.start).toBe('07:00')
    expect(store.getState().availabilityBlocks).toEqual([])
  })

  it('_setWorkHours should update config', () => {
    const config = { ...store.getState().workHours, slotDurationMinutes: 30 }
    store.getState()._setWorkHours(config)
    expect(store.getState().workHours.slotDurationMinutes).toBe(30)
  })

  it('hydrateWorkHours should load config from API', async () => {
    const mockConfig = { ...store.getState().workHours, slotDurationMinutes: 45 }
    mockGetWorkHours.mockResolvedValue(mockConfig)

    await store.getState().hydrateWorkHours()

    expect(store.getState().workHours.slotDurationMinutes).toBe(45)
  })
})
