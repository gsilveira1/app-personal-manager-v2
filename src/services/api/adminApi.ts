import apiClient from '../../utils/apiClient'
import type { AccountLimits, AccountStatus, AdminUserView, Paginated } from '../../types'

export type AdminUsersResponse = Paginated<AdminUserView>

/**
 * Lists trainer accounts (admin only).
 */
export const getAdminUsers = async (params?: { page?: number; limit?: number; status?: string }): Promise<AdminUsersResponse> => {
  const query = new URLSearchParams()
  if (params?.page) query.append('page', params.page.toString())
  if (params?.limit) query.append('limit', params.limit.toString())
  if (params?.status) query.append('status', params.status)

  const qs = query.toString() ? `?${query.toString()}` : ''
  return apiClient<AdminUsersResponse>(`/admin/users${qs}`)
}

/**
 * Updates a trainer account's status and/or limits (admin only).
 */
export const updateAdminUser = async (id: string, data: { status?: AccountStatus; limits?: Partial<AccountLimits> }): Promise<AdminUserView> =>
  apiClient<AdminUserView>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
