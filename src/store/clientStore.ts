import { create } from 'zustand'

import { type Client, type Plan } from '../types'
import * as api from '../services/api/apiService'
import { uploadFileToGcs } from '../utils/uploadToGcs'
import { createClientSlice, type ClientSlice } from './slices/clients/clientSlice'
import { createFinanceSlice, type FinanceSlice } from './slices/finance/financeSlice'

// The ClientStore combines the client slice (state + sync mutators) and the
// finance slice (plans state, needed for createPlan during addClient), plus
// all domain-level async actions that orchestrate API calls.
export interface ClientActions {
  addClient: (clientData: Omit<Client, 'id' | 'avatar'>, customPlanData?: Omit<Plan, 'id'>) => Promise<void>
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>
  uploadClientAvatar: (clientId: string, file: File) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  convertLead: (id: string, planId?: string) => Promise<void>
}

export type ClientStoreState = ClientSlice & FinanceSlice & ClientActions

export const useClientStore = create<ClientStoreState>()((...a) => ({
  ...createClientSlice(...a),
  ...createFinanceSlice(...a),

  addClient: async (clientData, customPlanData) => {
    const [set, get] = [a[0], a[1]]
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
    const [, get] = [a[0], a[1]]
    const updatedClient = await api.updateClient(id, updates)
    get()._updateClient(updatedClient)
  },

  uploadClientAvatar: async (clientId, file) => {
    const [, get] = [a[0], a[1]]
    const { uploadUrl, publicUrl } = await api.getAvatarUploadUrl(clientId, file.type)
    await uploadFileToGcs(uploadUrl, file)
    const updatedClient = await api.updateClient(clientId, { avatar: publicUrl })
    get()._updateClient(updatedClient)
  },

  deleteClient: async (id) => {
    const [, get] = [a[0], a[1]]
    await api.deleteClient(id)
    get()._removeClient(id)
  },

  convertLead: async (id, planId) => {
    const [, get] = [a[0], a[1]]
    const updatedClient = await api.convertLead(id, planId)
    get()._updateClient(updatedClient)
  },
}))

export type { ClientSlice }
export { createClientSlice }
