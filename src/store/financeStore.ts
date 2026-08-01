import { create } from 'zustand'

import { createFinanceSlice, type FinanceSlice } from './slices/finance/financeSlice'

export const useFinanceStore = create<FinanceSlice>()((...a) => ({
  ...createFinanceSlice(...a),
}))

export type { FinanceSlice }
export { createFinanceSlice }
