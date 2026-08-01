// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'

import { createClientSlice, type ClientSlice } from './clientSlice'

const createTestStore = () => create<ClientSlice>()((...a) => ({ ...createClientSlice(...a) }))

describe('clientSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('should initialize with empty clients array', () => {
    expect(store.getState().clients).toEqual([])
  })

  it('_setClients should replace entire array', () => {
    const clients = [
      { id: '1', name: 'Maria', email: 'maria@test.com', phone: '123', status: 'Active' as const, type: 'In-Person' as const },
      { id: '2', name: 'João', email: 'joao@test.com', phone: '456', status: 'Active' as const, type: 'Online' as const },
    ]
    store.getState()._setClients(clients)
    expect(store.getState().clients).toEqual(clients)
  })

  it('_addClient should append to array', () => {
    const client1 = { id: '1', name: 'Maria', email: 'maria@test.com', phone: '123', status: 'Active' as const, type: 'In-Person' as const }
    const client2 = { id: '2', name: 'João', email: 'joao@test.com', phone: '456', status: 'Active' as const, type: 'Online' as const }

    store.getState()._addClient(client1)
    expect(store.getState().clients).toHaveLength(1)

    store.getState()._addClient(client2)
    expect(store.getState().clients).toHaveLength(2)
    expect(store.getState().clients[1].name).toBe('João')
  })

  it('_updateClient should replace matching client by id', () => {
    const client = { id: '1', name: 'Maria', email: 'maria@test.com', phone: '123', status: 'Active' as const, type: 'In-Person' as const }
    store.getState()._setClients([client])

    const updated = { ...client, name: 'Maria Santos' }
    store.getState()._updateClient(updated)

    expect(store.getState().clients[0].name).toBe('Maria Santos')
  })

  it('_removeClient should filter out by id', () => {
    const clients = [
      { id: '1', name: 'Maria', email: 'maria@test.com', phone: '123', status: 'Active' as const, type: 'In-Person' as const },
      { id: '2', name: 'João', email: 'joao@test.com', phone: '456', status: 'Active' as const, type: 'Online' as const },
    ]
    store.getState()._setClients(clients)

    store.getState()._removeClient('1')

    expect(store.getState().clients).toHaveLength(1)
    expect(store.getState().clients[0].id).toBe('2')
  })
})
