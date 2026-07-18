import { describe, it, expect } from 'vitest'
import { parseStage, parseUserNotes, encodeNotes, daysAgo, interestLabel, whatsappUrl } from './leadHelpers'

describe('leadHelpers', () => {
  describe('parseStage', () => {
    it('returns "New" for null/undefined/empty notes', () => {
      expect(parseStage(null)).toBe('New')
      expect(parseStage(undefined)).toBe('New')
      expect(parseStage('')).toBe('New')
    })

    it('parses stage from JSON notes', () => {
      const notes = JSON.stringify({ __stage: 'Contacted', __userNotes: 'Called' })
      expect(parseStage(notes)).toBe('Contacted')
    })

    it('returns "New" when __stage is missing', () => {
      expect(parseStage(JSON.stringify({ __userNotes: 'test' }))).toBe('New')
    })

    it('returns "New" for non-JSON string', () => {
      expect(parseStage('plain text notes')).toBe('New')
    })
  })

  describe('parseUserNotes', () => {
    it('returns empty string for null/undefined/empty', () => {
      expect(parseUserNotes(null)).toBe('')
      expect(parseUserNotes(undefined)).toBe('')
      expect(parseUserNotes('')).toBe('')
    })

    it('parses userNotes from JSON', () => {
      const notes = JSON.stringify({ __stage: 'New', __userNotes: 'Called twice' })
      expect(parseUserNotes(notes)).toBe('Called twice')
    })

    it('returns raw string for non-JSON notes', () => {
      expect(parseUserNotes('plain text')).toBe('plain text')
    })

    it('returns empty when __userNotes missing', () => {
      expect(parseUserNotes(JSON.stringify({ __stage: 'New' }))).toBe('')
    })
  })

  describe('encodeNotes', () => {
    it('encodes stage and userNotes as JSON', () => {
      const result = encodeNotes('Contacted', 'Called yesterday')
      const parsed = JSON.parse(result)
      expect(parsed.__stage).toBe('Contacted')
      expect(parsed.__userNotes).toBe('Called yesterday')
    })
  })

  describe('daysAgo', () => {
    const t = (key: string, opts?: Record<string, unknown>) => {
      if (key === 'today') return 'today'
      if (key === 'oneDayAgo') return '1 day ago'
      if (key === 'daysAgo') return `${opts?.count} days ago`
      return key
    }

    it('returns empty string for undefined date', () => {
      expect(daysAgo(undefined, t)).toBe('')
    })

    it('returns "today" for today', () => {
      expect(daysAgo(new Date().toISOString(), t)).toBe('today')
    })

    it('returns "1 day ago" for yesterday', () => {
      const yesterday = new Date(Date.now() - 86_400_000).toISOString()
      expect(daysAgo(yesterday, t)).toBe('1 day ago')
    })

    it('returns "N days ago" for older dates', () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 86_400_000).toISOString()
      expect(daysAgo(fiveDaysAgo, t)).toBe('5 days ago')
    })
  })

  describe('interestLabel', () => {
    const t = (key: string) => key

    it('returns online for Online type', () => {
      expect(interestLabel('Online', t)).toBe('online')
    })

    it('returns inPerson for In-Person type', () => {
      expect(interestLabel('In-Person', t)).toBe('inPerson')
    })
  })

  describe('whatsappUrl', () => {
    it('strips non-digit characters and builds wa.me URL', () => {
      expect(whatsappUrl('(53) 99999-1111')).toBe('https://wa.me/53999991111')
    })

    it('handles already clean numbers', () => {
      expect(whatsappUrl('5399999111')).toBe('https://wa.me/5399999111')
    })
  })
})
