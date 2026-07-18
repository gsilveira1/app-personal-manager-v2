import { describe, it, expect, vi } from 'vitest'

vi.mock('../i18n', () => ({
  i18n: { language: 'en' },
}))

import { getDateLocale, formatLocalized } from './dateLocale'

describe('dateLocale', () => {
  describe('getDateLocale', () => {
    it('returns a locale object', () => {
      const locale = getDateLocale()
      expect(locale).toBeDefined()
      expect(locale.code).toBeDefined()
    })
  })

  describe('formatLocalized', () => {
    it('formats a date with given format string', () => {
      const date = new Date(2025, 0, 15)
      const result = formatLocalized(date, 'yyyy-MM-dd')
      expect(result).toBe('2025-01-15')
    })

    it('formats with time pattern', () => {
      const date = new Date(2025, 5, 15, 14, 30)
      const result = formatLocalized(date, 'HH:mm')
      expect(result).toBe('14:30')
    })
  })
})
