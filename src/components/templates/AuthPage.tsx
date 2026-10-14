import type { ReactNode } from 'react'

import { AppShell } from './AppShell'
import { AuthPageLayout } from './AuthPageLayout'

/**
 * Page template for login, sign-up and password recovery.
 *
 * @example
 * <AuthPage><Login /></AuthPage>
 */
export const AuthPage = ({ children }: { children: ReactNode }) => (
  <AppShell>
    <AuthPageLayout>{children}</AuthPageLayout>
  </AppShell>
)
