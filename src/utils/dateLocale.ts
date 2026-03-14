import { format as dateFnsFormat, type Locale } from 'date-fns'
import { enUS, es, ptBR } from 'date-fns/locale'
import { i18n } from '../i18n'

const localeMap: Record<string, Locale> = { en: enUS, es, pt: ptBR }

export function getDateLocale(): Locale {
  return localeMap[i18n.language?.substring(0, 2)] ?? ptBR
}

export function formatLocalized(date: Date | number, formatStr: string): string {
  return dateFnsFormat(date, formatStr, { locale: getDateLocale() })
}
