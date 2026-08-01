// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'

import { useAvailabilityStore } from './availabilityStore'

describe('availabilityStore', () => {
  beforeEach(() => {
    useAvailabilityStore.setState({ availabilityBlocks: [] })
  })

  it('should initialize with empty availabilityBlocks', () => {
    expect(useAvailabilityStore.getState().availabilityBlocks).toEqual([])
  })
})
