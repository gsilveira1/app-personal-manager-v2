import { create } from 'zustand'

import { createAuthSlice, type AuthSlice } from '../../slices/auth/authSlice'

/**
 * Dedicated Zustand hook for consuming authentication state and actions.
 *
 * @example
 * const { user, isAuthenticated, login } = useAuthStore();
 */
export const useAuthStore = create<AuthSlice>()((...a) => ({
  ...createAuthSlice(...a),
}))

export type { AuthSlice as AuthState }
export { createAuthSlice }
