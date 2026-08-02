import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import { type Client, type Plan } from '../../../types'
import * as api from '../../../services/api/apiService'
import { uploadFileToGcs } from '../../../utils/uploadToGcs'
import { createClientSlice, type ClientSlice } from '../../slices/clients/clientSlice'
import { createFinanceSlice, type FinanceSlice } from '../../slices/finance/financeSlice'

/**
 * Async API actions domain interface for managing client lifecycle and state.
 */
export interface ClientActions {
  /**
   * Creates a new client and optionally creates/associates a custom plan.
   * 
   * @param clientData - Client fields excluding generated ID and avatar
   * @param customPlanData - Optional plan details to create for client
   * @returns A promise resolving when client is created and added to state
   */
  addClient: (clientData: Omit<Client, 'id' | 'avatar'>, customPlanData?: Omit<Plan, 'id'>) => Promise<void>
  /**
   * Updates an existing client entity on backend and state.
   * 
   * @param id - Unique identifier of client
   * @param updates - Partial fields to update
   * @returns A promise resolving when client update completes
   */
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>
  /**
   * Uploads client avatar image file to GCS and updates profile.
   * 
   * @param clientId - Unique identifier of client
   * @param file - Avatar image File object
   * @returns A promise resolving when avatar upload completes
   */
  uploadClientAvatar: (clientId: string, file: File) => Promise<void>
  /**
   * Deletes a client entity from backend and state.
   * 
   * @param id - Unique identifier of client to delete
   * @returns A promise resolving when deletion completes
   */
  deleteClient: (id: string) => Promise<void>
  /**
   * Converts a lead client to an active member with optional plan assignment.
   * 
   * @param id - Unique identifier of lead client
   * @param planId - Optional plan ID to assign upon conversion
   * @returns A promise resolving when conversion completes
   */
  convertLead: (id: string, planId?: string) => Promise<void>
}

/** Composite state type combining ClientSlice, FinanceSlice, and ClientActions. */
export type ClientStoreState = ClientSlice & FinanceSlice & ClientActions

/**
 * Single source of truth for all client async actions.
 * Consumed by both useClientStore (standalone) and useStore (global).
 * 
 * @param set - Zustand state setter function
 * @param get - Zustand state getter function
 * @returns Object containing client async action implementations
 */
export const createClientActions: StateCreator<ClientStoreState, [], [], ClientActions> = (set, get) => ({
  addClient: async (clientData, customPlanData) => {
    const finalClientData = { ...clientData }
    if (customPlanData) {
      const newPlan = await api.createPlan(customPlanData)
      get()._addPlan(newPlan)
      finalClientData.planId = newPlan.id
    }
    const newClient = await api.createClient(finalClientData)
    get()._addClient(newClient)
  },

  updateClient: async (id, updates) => {
    const updatedClient = await api.updateClient(id, updates)
    get()._updateClient(updatedClient)
  },

  uploadClientAvatar: async (clientId, file) => {
    const { uploadUrl, publicUrl } = await api.getAvatarUploadUrl(clientId, file.type)
    await uploadFileToGcs(uploadUrl, file)
    const updatedClient = await api.updateClient(clientId, { avatar: publicUrl })
    get()._updateClient(updatedClient)
  },

  deleteClient: async (id) => {
    await api.deleteClient(id)
    get()._removeClient(id)
  },

  convertLead: async (id, planId) => {
    const updatedClient = await api.convertLead(id, planId)
    get()._updateClient(updatedClient)
  },
})

/**
 * Zustand hook for managing client state and actions.
 * 
 * @example
 * const { clients, addClient } = useClientStore();
 */
export const useClientStore = create<ClientStoreState>()((...a) => ({
  ...createClientSlice(...a),
  ...createFinanceSlice(...a),
  ...createClientActions(...a),
}))

export type { ClientSlice }
export { createClientSlice }
