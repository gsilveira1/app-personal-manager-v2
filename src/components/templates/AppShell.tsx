import { useEffect, useState, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'

import { i18n } from '../../i18n/index'
import { useI18nBoot } from '../../hooks/useI18nBoot'
import { useStore } from '../../states/stores/store'
import { useAuthStore } from '../../states/stores/auth/authStore'
import { legacyHashPath } from '../../utils/spaFallback'
import { navigateTo } from '../../utils/navigation'
import { FullScreenError, FullScreenLoader } from '../molecules/FullScreenStatus'

// The translations themselves failed to load, so this one screen cannot be translated.
const I18N_BOOT_ERROR_TEXTS = {
  title: 'Não foi possível iniciar o aplicativo',
  message: 'Ocorreu um erro ao carregar os textos da interface.',
  retry: 'Tentar novamente',
}

/** Links sent before the move away from the hash router (`/#/p/slug?token=…`) must keep working. */
const legacyRedirectTarget = (): string | null => (typeof window === 'undefined' ? null : legacyHashPath(window.location.hash))

/**
 * Everything a page island needs before any view renders: translations, the current session and
 * the locale the account prefers. Astro mounts every island on its own, so each page carries this.
 *
 * @example
 * <AppShell><Login /></AppShell>
 */
export const AppShell = ({ children }: { children: ReactNode }) => {
  const [legacyTarget] = useState(legacyRedirectTarget)
  const { boot, retry } = useI18nBoot()
  const { checkAuthStatus, isLoading } = useAuthStore()
  const locale = useStore((s) => s.locale)

  useEffect(() => {
    if (legacyTarget) navigateTo(legacyTarget, { replace: true })
    else checkAuthStatus()
  }, [legacyTarget, checkAuthStatus])

  useEffect(() => {
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale)
    }
  }, [locale])

  if (boot.status === 'failed') {
    return <FullScreenError message={boot.message} onRetry={retry} texts={I18N_BOOT_ERROR_TEXTS} />
  }

  if (legacyTarget || boot.status === 'pending') {
    return <FullScreenLoader message="" />
  }

  if (isLoading) {
    return <FullScreenLoader message={i18n.t('checkingSession')} />
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
