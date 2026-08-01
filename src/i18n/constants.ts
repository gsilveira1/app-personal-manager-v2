export const SUPPORTED_LOCALES = ['en', 'es', 'pt', 'pt-BR'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
