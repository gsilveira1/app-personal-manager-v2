import { create } from 'zustand'

import { createAuthSlice, type AuthSlice } from './slices/auth/authSlice'

export const useAuthStore = create<AuthSlice>()((...a) => ({
  ...createAuthSlice(...a),
}))

export type { AuthSlice as AuthState }
export { createAuthSlice }
