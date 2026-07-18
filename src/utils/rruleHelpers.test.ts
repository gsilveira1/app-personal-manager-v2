import { describe, it, expect } from 'vitest'
import { buildRrule, rruleHumanText, WEEKDAYS } from './rruleHelpers'

describe('rruleHelpers', () => {
  describe('WEEKDAYS', () => {
    it('has 7 entries', () => {
      expect(WEEKDAYS).toHaveLength(7)
    })

    it('starts with Monday', () => {
      expect(WEEKDAYS[0]).toEqual({ label: 'Mon', rruleDay: 'MO' })
    })
  })

  describe('buildRrule', () => {
    it('builds a weekly rule with BYDAY and COUNT', () => {
      const result = buildRrule('WEEKLY', 1, ['MO', 'WE', 'FR'], 'count', '', 10)
      expect(result).toBe('FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR;COUNT=10')
    })

    it('builds a weekly rule with UNTIL', () => {
      const result = buildRrule('WEEKLY', 2, ['TU', 'TH'], 'until', '2025-12-31', 0)
      expect(result).toContain('FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;UNTIL=')
      expect(result).toContain('20251231')
    })

    it('builds a daily rule without BYDAY', () => {
      const result = buildRrule('DAILY', 1, [], 'count', '', 5)
      expect(result).toBe('FREQ=DAILY;INTERVAL=1;COUNT=5')
      expect(result).not.toContain('BYDAY')
    })

    it('builds a monthly rule', () => {
      const result = buildRrule('MONTHLY', 1, [], 'count', '', 12)
      expect(result).toBe('FREQ=MONTHLY;INTERVAL=1;COUNT=12')
    })
  })

  describe('rruleHumanText', () => {
    it('returns human-readable text for weekly with days and count', () => {
      const result = rruleHumanText('WEEKLY', 1, ['MO', 'WE'], 'count', '', 10)
      expect(result).toBe('Every week on MO, WE, 10 times')
    })

    it('handles intervals > 1', () => {
      const result = rruleHumanText('WEEKLY', 2, ['FR'], 'until', '2025-12-31', 0)
      expect(result).toBe('Every 2 weeks on FR until 2025-12-31')
    })

    it('handles daily frequency', () => {
      const result = rruleHumanText('DAILY', 1, [], 'count', '', 30)
      expect(result).toBe('Every day, 30 times')
    })

    it('handles monthly frequency', () => {
      const result = rruleHumanText('MONTHLY', 3, [], 'until', '2026-06-30', 0)
      expect(result).toBe('Every 3 months until 2026-06-30')
    })
  })
})
