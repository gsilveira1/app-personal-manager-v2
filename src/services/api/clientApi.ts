import type { ActivityHeatmapData, Client, Paginated, Payment, RecordPaymentBody, WelcomeMessageOutcome } from '../../types'
import apiClient, { ApiError, API_BASE_URL } from '../../utils/apiClient'
import { toClient, toClientBody, toPayment, type ClientWire, type PaymentWire } from './mappers/clientMapper'

/** Largest page `GET /clients` serves. */
export const CLIENTS_MAX_PAGE_SIZE = 500

export interface ClientListParams {
  page?: number
  limit?: number
  search?: string
  modality?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

const toQuery = (params: object) => {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.append(key, String(value))
  }
  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

/**
 * Retrieves one page of clients (leads included unless `status` filters them out).
 */
export const getClients = async (params: ClientListParams = {}): Promise<Paginated<Client>> => {
  const page = await apiClient<Paginated<ClientWire>>(`/clients${toQuery(params)}`)
  return { ...page, items: page.items.map(toClient) }
}

/**
 * Retrieves every client by walking the pages of `GET /clients` at the maximum page size.
 */
export const getAllClients = async (params: Omit<ClientListParams, 'page' | 'limit'> = {}): Promise<Client[]> => {
  const all: Client[] = []
  let page = 1
  let totalPages = 1
  do {
    const result = await getClients({ ...params, page, limit: CLIENTS_MAX_PAGE_SIZE })
    all.push(...result.items)
    totalPages = result.totalPages
    page += 1
  } while (page <= totalPages)
  return all
}

/**
 * Creates a new client record. `welcomeMessage` tells whether the welcome/anamnesis
 * message was queued, skipped (notifications off) or failed.
 */
export const createClient = async (client: Omit<Client, 'id' | 'avatar'>): Promise<{ client: Client; welcomeMessage: WelcomeMessageOutcome }> => {
  const { welcomeMessage, ...wire } = await apiClient<ClientWire & { welcomeMessage: WelcomeMessageOutcome }>('/clients', {
    method: 'POST',
    body: JSON.stringify(toClientBody(client)),
  })
  return { client: toClient(wire), welcomeMessage }
}

/**
 * Updates an existing client details.
 */
export const updateClient = async (id: string, updates: Partial<Client>) =>
  toClient(
    await apiClient<ClientWire>(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(toClientBody(updates)),
    })
  )

/**
 * Changes a client's status (e.g. pause / reactivate).
 */
export const updateClientStatus = async (id: string, status: Client['status']) =>
  toClient(
    await apiClient<ClientWire>(`/clients/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  )

/**
 * Deletes a client record (soft delete on the server; a second call answers 404).
 */
export const deleteClient = async (id: string) =>
  apiClient<void>(`/clients/${id}`, {
    method: 'DELETE',
  })

/**
 * Retrieves the lead pipeline list.
 */
export const getLeads = async () => (await apiClient<ClientWire[]>('/clients/leads')).map(toClient)

/**
 * Converts a lead to a client and optionally assigns a subscription/plan.
 */
export const convertLead = async (id: string, planId?: string) =>
  toClient(
    await apiClient<ClientWire>(`/clients/${id}/convert`, {
      method: 'PATCH',
      body: JSON.stringify(planId ? { planId } : {}),
    })
  )

/**
 * Requests a signed upload URL to upload client avatar.
 */
export const getAvatarUploadUrl = async (clientId: string, contentType: string) =>
  apiClient<{ uploadUrl: string; publicUrl: string }>(`/clients/${clientId}/avatar-upload-url`, {
    method: 'POST',
    body: JSON.stringify({ contentType }),
  })

/**
 * Records a manual payment. The server marks the client ACTIVE and moves its period end
 * in the same transaction, and returns the updated client.
 */
export const recordPayment = async (id: string, data: RecordPaymentBody): Promise<{ message: string; payment: Payment; client: Client }> => {
  const res = await apiClient<{ message: string; payment: PaymentWire; client: ClientWire }>(`/clients/${id}/payments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return { message: res.message, payment: toPayment(res.payment), client: toClient(res.client) }
}

/**
 * Retrieves the workout-consistency heatmap of a client.
 */
export const getActivityHeatmap = async (id: string, days: number = 30): Promise<ActivityHeatmapData> => apiClient<ActivityHeatmapData>(`/clients/${id}/activity-heatmap?days=${days}`)

export const getExportCsvUrl = (): string => `${API_BASE_URL}/clients/export/csv`

/**
 * Downloads the client list as CSV. The route needs the bearer token, so it cannot
 * be opened as a plain link.
 */
export const downloadClientsCsv = async (): Promise<Blob> => {
  const token = localStorage.getItem('token')
  let response: Response
  try {
    response = await fetch(getExportCsvUrl(), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  } catch (error) {
    console.error(`Clients CSV export network error: ${(error as Error).message}`)
    throw new ApiError('A network error occurred. Please check your connection.', 0)
  }
  if (!response.ok) {
    throw new ApiError(`CSV export failed with status ${response.status}`, response.status)
  }
  return response.blob()
}
