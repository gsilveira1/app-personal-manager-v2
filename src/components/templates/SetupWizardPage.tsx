import { useEffect, type ReactNode } from 'react'

import { i18n } from '../../i18n/index'
import { useAuthStore } from '../../states/stores/auth/authStore'
import { navigateTo } from '../../utils/navigation'
import { FullScreenLoader } from '../molecules/FullScreenStatus'
import { AppShell } from './AppShell'

const SessionOnly = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) navigateTo('/login', { replace: true })
  }, [isAuthenticated])

  return isAuthenticated ? <>{children}</> : <FullScreenLoader message={i18n.t('checkingSession')} />
}

/**
 * Page template for the setup wizard: needs a session but none of the account gates or the
 * dashboard data, because the wizard is what completes the account.
 *
 * @example
 * <SetupWizardPage><SetupWizard /></SetupWizardPage>
 */
export const SetupWizardPage = ({ children }: { children: ReactNode }) => (
  <AppShell>
    <SessionOnly>{children}</SessionOnly>
  </AppShell>
)
