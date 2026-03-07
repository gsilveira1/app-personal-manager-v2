import type { CustomDetector } from 'i18next-browser-languagedetector'

import { updateLanguage } from '../services/apiService'
import { useStore } from '../store/store'

export const localeDetector: CustomDetector = {
  name: 'localeDetector',

  lookup(): string | undefined {
    const locale = useStore.getState().locale
    return locale || undefined
  },

  cacheUserLanguage(lng: string): void {
    updateLanguage(lng).catch((err: unknown) => {
      console.error('[localeDetector] Failed to persist language preference:', err)
    })
  },
}
