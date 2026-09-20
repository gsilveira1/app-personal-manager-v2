import apiClient from '../../utils/apiClient'
import type { AdminTenant } from '../../types'

export interface AdminTenantsResponse {
  items: AdminTenant[]
  total: number
  page: number
  totalPages: number
}

export const getAdminTenants = async (params?: {
  page?: number
  limit?: number
  status?: string
}): Promise<AdminTenantsResponse> => {
  const query = new URLSearchParams()
  if (params?.page) query.append('page', params.page.toString())
  if (params?.limit) query.append('limit', params.limit.toString())
  if (params?.status) query.append('status', params.status)

  const qs = query.toString() ? `?${query.toString()}` : ''
  return apiClient<AdminTenantsResponse>(`/admin/tenants${qs}`)
}

export const createAdminTenant = async (data: {
  name: string
  slug: string
  email: string
  maxStudents?: number
  canUploadVideos?: boolean
  whatsappAlerts?: boolean
}): Promise<AdminTenant> => {
  return apiClient<AdminTenant>('/admin/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const updateAdminTenant = async (
  id: string,
  data: {
    status?: 'ACTIVE' | 'BLOCKED' | 'OVERDUE'
    features?: Record<string, any>
  },
): Promise<AdminTenant> => {
  return apiClient<AdminTenant>(`/admin/tenants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
