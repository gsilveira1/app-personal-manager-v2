import { create } from 'zustand'
import { createAccountSlice, type AccountSlice } from '../../slices/account/accountSlice'

/**
 * Zustand hook for the trainer account: branding, WhatsApp connection and setup wizard.
 *
 * @example
 * const { account, updateBranding } = useAccountStore();
 */
export const useAccountStore = create<AccountSlice>()((...a) => ({
  ...createAccountSlice(...a),
}))

export type { AccountSlice as AccountState }
export { createAccountSlice }
