import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { useStore } from '../store/store'

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt-BR', label: 'Português (BR)' },
] as const

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation('common')
  const updateLocale = useStore((s) => s.updateLocale)
  const [isSwitching, setIsSwitching] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lng = e.target.value
    if (lng === i18n.language) return
    setIsSwitching(true)
    try {
      await i18n.changeLanguage(lng)
      await updateLocale(lng)
    } catch (err) {
      console.error('[LanguageSwitcher] Failed to persist language:', err)
    } finally {
      setIsSwitching(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-slate-500" />
      <select
        value={i18n.language}
        disabled={isSwitching}
        onChange={handleChange}
        aria-label={t('selectLanguage')}
        className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {LANGUAGE_OPTIONS.map(({ code, label }) => (
          <option key={code} value={code} aria-current={i18n.language === code ? 'true' : undefined}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
