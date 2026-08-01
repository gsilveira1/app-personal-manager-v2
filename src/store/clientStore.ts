import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import { type Client, type Plan } from '../types'
import * as api from '../services/api/apiService'
import { uploadFileToGcs } from '../utils/uploadToGcs'
import { createClientSlice, type ClientSlice } from './slices/clients/clientSlice'
import { createFinanceSlice, type FinanceSlice } from './slices/finance/financeSlice'

export interface ClientActions {
  addClient: (clientData: Omit<Client, 'id' | 'avatar'>, customPlanData?: Omit<Plan, 'id'>) => Promise<void>
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>
  uploadClientAvatar: (clientId: string, file: File) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  convertLead: (id: string, planId?: string) => Promise<void>
}

export type ClientStoreState = ClientSlice & FinanceSlice & ClientActions

// Single source of truth for all client async actions.
// Consumed by both useClientStore (standalone) and useStore (global).
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

export const useClientStore = create<ClientStoreState>()((...a) => ({
  ...createClientSlice(...a),
  ...createFinanceSlice(...a),
  ...createClientActions(...a),
}))

export type { ClientSlice }
export { createClientSlice }
