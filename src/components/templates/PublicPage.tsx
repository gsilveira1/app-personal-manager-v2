import type { ReactNode } from 'react'

import { AppShell } from './AppShell'

/**
 * Page template for views reached by magic link or shown to locked-out accounts: the shell only.
 *
 * @example
 * <PublicPage><WorkoutPlayer /></PublicPage>
 */
export const PublicPage = ({ children }: { children: ReactNode }) => <AppShell>{children}</AppShell>
