import { useEffect, type ReactNode } from 'react'

import { i18n } from '../../i18n/index'
import { useStore } from '../../states/stores/store'
import { useAuthStore } from '../../states/stores/auth/authStore'
import { resolveAccountGate } from '../../utils/accountGate'
import { navigateTo } from '../../utils/navigation'
import { FullScreenError, FullScreenLoader } from '../molecules/FullScreenStatus'
import { AppShell } from './AppShell'
import { DashboardLayout } from './DashboardLayout'

export interface ProtectedPageProps {
  children: ReactNode
  /** Only the platform admin may see the page; everyone else is sent to the dashboard. */
  requireAdmin?: boolean
  /** Render the view without the sidebar and header (the setup wizard). */
  bare?: boolean
}

/**
 * Where an authenticated trainer must be sent instead of this page, or null to stay.
 * The order matters: blocked accounts first, then the mandatory setup wizard, then admin-only pages.
 */
const redirectFor = (user: ReturnType<typeof useAuthStore.getState>['user'], isAuthenticated: boolean, requireAdmin: boolean): string | null => {
  if (!isAuthenticated) return '/login'
  const gate = resolveAccountGate(user)
  if (gate === 'blocked') return '/blocked'
  if (gate === 'setup') return '/setup-wizard'
  if (requireAdmin && user?.role !== 'admin') return '/'
  return null
}

const ProtectedContent = ({ children, requireAdmin = false, bare = false }: ProtectedPageProps) => {
  const { isAuthenticated, user } = useAuthStore()
  const { appState, errorMessage, fetchInitialData, clearDataOnLogout } = useStore()
  const redirect = redirectFor(user, isAuthenticated, requireAdmin)

  useEffect(() => {
    if (redirect) {
      if (appState !== 'idle') clearDataOnLogout()
      navigateTo(redirect, { replace: true })
    } else if (appState === 'idle') {
      fetchInitialData()
    }
  }, [redirect, appState, fetchInitialData, clearDataOnLogout])

  if (redirect || appState === 'loading' || appState === 'idle') {
    return <FullScreenLoader message={i18n.t('appLoading')} />
  }

  if (appState === 'error') {
    const texts = { title: i18n.t('appError.title'), message: i18n.t('appError.message'), retry: i18n.t('appError.retry') }
    return <FullScreenError message={errorMessage} onRetry={fetchInitialData} texts={texts} />
  }

  return bare ? <>{children}</> : <DashboardLayout>{children}</DashboardLayout>
}

/**
 * Page template for the trainer area: boots the shell, enforces the session and account gates,
 * loads the initial data once and wraps the view in the dashboard layout.
 *
 * @example
 * <ProtectedPage><Clients /></ProtectedPage>
 * <ProtectedPage requireAdmin><AdminUsers /></ProtectedPage>
 */
export const ProtectedPage = (props: ProtectedPageProps) => (
  <AppShell>
    <ProtectedContent {...props} />
  </AppShell>
)
