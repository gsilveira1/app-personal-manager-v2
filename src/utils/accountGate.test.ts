// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { resolveAccountGate } from './accountGate'

describe('resolveAccountGate', () => {
  it.each(['BLOCKED', 'OVERDUE'] as const)('stops a %s account even when setup is pending', (status) => {
    expect(resolveAccountGate({ status, setupCompleted: false })).toBe('blocked')
  })

  it('sends an active account with pending setup to the wizard', () => {
    expect(resolveAccountGate({ status: 'ACTIVE', setupCompleted: false })).toBe('setup')
  })

  it('opens the app for an active, set-up account', () => {
    expect(resolveAccountGate({ status: 'ACTIVE', setupCompleted: true })).toBe('open')
  })

  it('does not gate while the user is not loaded', () => {
    expect(resolveAccountGate(null)).toBe('open')
  })
})
