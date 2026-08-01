import { create } from 'zustand'

import { createClientSlice, type ClientSlice } from './slices/clients/clientSlice'

export const useClientStore = create<ClientSlice>()((...a) => ({
  ...createClientSlice(...a),
}))

export type { ClientSlice }
export { createClientSlice }
