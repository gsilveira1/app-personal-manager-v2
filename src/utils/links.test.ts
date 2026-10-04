// @vitest-environment node
import { describe, it, expect } from 'vitest'

import { toAbsoluteLink } from './links'

describe('toAbsoluteLink', () => {
  it('keeps an absolute magic link as the API sent it', () => {
    expect(toAbsoluteLink('https://app.vivi.com/#/anamnesis?token=abc', 'http://localhost:5173')).toBe('https://app.vivi.com/#/anamnesis?token=abc')
  })

  it('resolves a relative link against the origin', () => {
    expect(toAbsoluteLink('/#/p/slug?token=abc', 'http://localhost:5173')).toBe('http://localhost:5173/#/p/slug?token=abc')
    expect(toAbsoluteLink('#/p/slug', 'http://localhost:5173')).toBe('http://localhost:5173/#/p/slug')
  })
})
