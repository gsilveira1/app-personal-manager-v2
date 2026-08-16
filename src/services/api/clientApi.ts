import { type Client } from '../../types'
import apiClient from '../../utils/apiClient'

/**
 * Retrieves list of all clients.
 */
export const getClients = async () => apiClient<Client[]>('/clients')

/**
 * Creates a new client record.
 */
export const createClient = async (client: Omit<Client, 'id' | 'avatar'>) =>
  apiClient<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  })

/**
 * Updates an existing client details.
 */
export const updateClient = async (id: string, updates: Partial<Client>) =>
  apiClient<Client>(`/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })

/**
 * Deletes a client record.
 */
export const deleteClient = async (id: string) =>
  apiClient<void>(`/clients/${id}`, {
    method: 'DELETE',
  })

/**
 * Retrieves the lead pipeline list.
 */
export const getLeads = async () => apiClient<Client[]>('/clients/leads')

/**
 * Converts a lead to a client and optionally assigns a subscription/plan.
 */
export const convertLead = async (id: string, planId?: string) =>
  apiClient<Client>(`/clients/${id}/convert`, {
    method: 'PATCH',
    body: JSON.stringify(planId ? { planId } : {}),
  })

/**
 * Requests a signed upload URL to upload client avatar.
 */
export const getAvatarUploadUrl = async (clientId: string, contentType: string) =>
  apiClient<{ uploadUrl: string; publicUrl: string }>(`/clients/${clientId}/avatar-upload-url`, {
    method: 'POST',
    body: JSON.stringify({ contentType }),
  })
