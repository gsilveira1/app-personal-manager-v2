import { create } from 'zustand'
import { createTenantSlice, type TenantSlice } from '../../slices/tenant/tenantSlice'

export const useTenantStore = create<TenantSlice>()((...a) => ({
  ...createTenantSlice(...a),
}))

export type { TenantSlice as TenantState }
export { createTenantSlice }
