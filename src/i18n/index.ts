import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import { localeDetector } from './localeDetector'

import { SUPPORTED_LOCALES, type SupportedLocale } from './constants'
export { SUPPORTED_LOCALES, type SupportedLocale }

const namespaces = ['common', 'navigation', 'auth', 'clients', 'schedule', 'workouts', 'finances', 'leads', 'settings', 'setupWizard', 'notifications', 'ai']

const localeFiles = import.meta.glob('../locales/**/*.json', { eager: true }) as Record<string, { default: Record<string, unknown> }>

function buildResources() {
  const resources: Record<string, Record<string, Record<string, unknown>>> = {}

  for (const path in localeFiles) {
    const match = path.match(/\/locales\/([^/]+)\/([^/]+)\.json$/)
    if (!match) continue
    const [, locale, ns] = match
    if (!resources[locale]) resources[locale] = {}
    resources[locale][ns] = localeFiles[path].default
  }

  return resources
}

const detector = new LanguageDetector()
detector.addDetector(localeDetector)

export const i18n = i18next.createInstance()

async function configure(): Promise<void> {
  await i18n
    .use(detector)
    .use(initReactI18next)
    .init({
      resources: buildResources(),
      ns: namespaces,
      defaultNS: 'common',
      supportedLngs: [...SUPPORTED_LOCALES],
      nonExplicitSupportedLngs: true,
      fallbackLng: 'pt',
      detection: {
        order: ['localeDetector', 'localStorage', 'navigator'],
        caches: [],
      },
      interpolation: {
        escapeValue: false,
      },
    })
}

let initialisation: Promise<void> | null = null

/**
 * Initialises the shared i18n instance. Safe to call from every island: the work runs once,
 * and a failed attempt is forgotten so the next call retries.
 *
 * @example
 * await initI18n()
 */
export function initI18n(): Promise<void> {
  initialisation ??= configure().catch((error: unknown) => {
    initialisation = null
    throw error
  })
  return initialisation
}
