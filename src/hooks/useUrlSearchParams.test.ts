import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useUrlSearchParams } from './useUrlSearchParams'

describe('useUrlSearchParams', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/notifications')
  })

  it('reads the query string of the current page', () => {
    window.history.replaceState(null, '', '/notifications?tab=whatsapp')
    const { result } = renderHook(() => useUrlSearchParams())
    expect(result.current[0].get('tab')).toBe('whatsapp')
  })

  it('writes the query string and pushes a history entry', () => {
    const { result } = renderHook(() => useUrlSearchParams())
    const before = window.history.length

    act(() => {
      result.current[1]((current) => {
        const next = new URLSearchParams(current)
        next.set('tab', 'automations')
        return next
      })
    })

    expect(window.location.search).toBe('?tab=automations')
    expect(result.current[0].get('tab')).toBe('automations')
    expect(window.history.length).toBe(before + 1)
  })

  it('drops the question mark when the last parameter is removed', () => {
    window.history.replaceState(null, '', '/notifications?tab=whatsapp')
    const { result } = renderHook(() => useUrlSearchParams())

    act(() => result.current[1](new URLSearchParams()))

    expect(window.location.search).toBe('')
    expect(window.location.pathname).toBe('/notifications')
  })

  it('follows the browser back button', () => {
    const { result } = renderHook(() => useUrlSearchParams())

    act(() => {
      window.history.replaceState(null, '', '/notifications?tab=queue')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(result.current[0].get('tab')).toBe('queue')
  })
})
