import { type StateCreator } from 'zustand'

import { type Client } from '../../../types'

/**
 * Slice managing clients state and synchronous local mutations.
 */
export interface ClientSlice {
  /** Array of active client records. */
  clients: Client[]
  /**
   * Replaces the entire clients list in state.
   *
   * @param clients - List of clients to set
   */
  _setClients: (clients: Client[]) => void
  /**
   * Appends a new client record to state.
   *
   * @param client - The new Client entity
   */
  _addClient: (client: Client) => void
  /**
   * Updates an existing client record in state by matching ID.
   *
   * @param client - The updated Client entity
   */
  _updateClient: (client: Client) => void
  /**
   * Removes a client record from state by ID.
   *
   * @param clientId - The unique identifier of the client to remove
   */
  _removeClient: (clientId: string) => void
}

/**
 * Creates the client slice state creator for Zustand store integration.
 *
 * @param set - Zustand state setter function
 * @returns Initialized ClientSlice state object and synchronous mutators
 * @example
 * const slice = createClientSlice(set, get, storeApi);
 */
export const createClientSlice: StateCreator<ClientSlice, [], [], ClientSlice> = (set) => ({
  clients: [],
  _setClients: (clients) => set({ clients }),
  _addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
  _updateClient: (client) =>
    set((state) => ({
      clients: state.clients.map((c) => (c.id === client.id ? client : c)),
    })),
  _removeClient: (clientId) =>
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== clientId),
    })),
})
