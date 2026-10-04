import { useCallback, useEffect, useState } from 'react'

import { initI18n } from '../i18n/index'

export type I18nBoot = { status: 'pending' } | { status: 'ready' } | { status: 'failed'; message: string }

/**
 * Initialises i18n from inside the island that needs it. Astro mounts each island on its own,
 * so there is no shared entry point to do it; views rendered before `ready` would suspend forever.
 *
 * @example
 * const { boot, retry } = useI18nBoot()
 * if (boot.status !== 'ready') return <Spinner />
 */
export function useI18nBoot(): { boot: I18nBoot; retry: () => void } {
  const [boot, setBoot] = useState<I18nBoot>({ status: 'pending' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    initI18n()
      .then(() => {
        if (!cancelled) setBoot({ status: 'ready' })
      })
      .catch((error: unknown) => {
        console.error('[i18n] Initialisation failed:', error)
        if (!cancelled) setBoot({ status: 'failed', message: error instanceof Error ? error.message : String(error) })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setBoot({ status: 'pending' })
    setAttempt((n) => n + 1)
  }, [])

  return { boot, retry }
}
