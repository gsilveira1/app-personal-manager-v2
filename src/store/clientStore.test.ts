// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'

import { useClientStore } from './clientStore'

describe('clientStore', () => {
  beforeEach(() => {
    useClientStore.setState({ clients: [] })
  })

  it('should initialize with empty clients array', () => {
    expect(useClientStore.getState().clients).toEqual([])
  })

  it('should manage clients state correctly', () => {
    const client = { id: '1', name: 'Maria', email: 'maria@test.com', phone: '123', status: 'Active' as const, type: 'In-Person' as const }
    useClientStore.getState()._addClient(client)
    expect(useClientStore.getState().clients).toEqual([client])

    useClientStore.getState()._updateClient({ ...client, name: 'Maria Silva' })
    expect(useClientStore.getState().clients[0].name).toBe('Maria Silva')

    useClientStore.getState()._removeClient('1')
    expect(useClientStore.getState().clients).toEqual([])
  })
})
