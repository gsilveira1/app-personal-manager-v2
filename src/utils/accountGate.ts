import type { User } from '../types'

export type AccountGate = 'blocked' | 'setup' | 'open'

/**
 * Decides where an authenticated trainer may go. A blocked or overdue account is
 * stopped first; an account that has not finished the setup wizard goes there next.
 */
export const resolveAccountGate = (user: Pick<User, 'status' | 'setupCompleted'> | null): AccountGate => {
  if (user?.status === 'BLOCKED' || user?.status === 'OVERDUE') return 'blocked'
  if (user?.setupCompleted === false) return 'setup'
  return 'open'
}
