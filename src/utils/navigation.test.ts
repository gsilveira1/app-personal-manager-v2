import { describe, it, expect, vi } from 'vitest'
import { clientIdFromPath, isActivePath, navigateTo, workoutSlugFromPath } from './navigation'

describe('navigateTo', () => {
  const target = () => ({ assign: vi.fn(), replace: vi.fn() })

  it('loads the page by pushing a history entry', () => {
    const location = target()
    navigateTo('/clients/1', {}, location)
    expect(location.assign).toHaveBeenCalledWith('/clients/1')
    expect(location.replace).not.toHaveBeenCalled()
  })

  it('replaces the history entry for redirects', () => {
    const location = target()
    navigateTo('/login', { replace: true }, location)
    expect(location.replace).toHaveBeenCalledWith('/login')
    expect(location.assign).not.toHaveBeenCalled()
  })

  it('does nothing without a location (server render)', () => {
    expect(() => navigateTo('/login', {}, null)).not.toThrow()
  })
})

describe('isActivePath', () => {
  it.each([
    ['/', '/'],
    ['/', '/dashboard'],
    ['/', '/dashboards'],
    ['/clients', '/clients'],
    ['/clients', '/clients/'],
    ['/clients', '/clients/42'],
    ['/admin/users', '/admin/users'],
  ])('marks %s active on %s', (href, pathname) => {
    expect(isActivePath(href, pathname)).toBe(true)
  })

  it.each([
    ['/', '/clients'],
    ['/clients', '/'],
    ['/clients', '/clientsx'],
    ['/schedule', '/schedules'],
    ['/ai', '/ai-settings'],
  ])('keeps %s inactive on %s', (href, pathname) => {
    expect(isActivePath(href, pathname)).toBe(false)
  })

  it('reads the browser location when no pathname is given', () => {
    window.history.replaceState(null, '', '/workouts')
    expect(isActivePath('/workouts')).toBe(true)
    expect(isActivePath('/leads')).toBe(false)
  })
})

describe('clientIdFromPath', () => {
  it('extracts the id of a client-details URL', () => {
    expect(clientIdFromPath('/clients/2bd789b0-893e-4242-bbfd-c223f7f63b8d')).toBe('2bd789b0-893e-4242-bbfd-c223f7f63b8d')
    expect(clientIdFromPath('/clients/c1/')).toBe('c1')
    expect(clientIdFromPath('/clients/a%20b')).toBe('a b')
  })

  it.each(['/clients', '/clients/', '/clients/1/extra', '/p/slug', '/'])('returns null for %s', (pathname) => {
    expect(clientIdFromPath(pathname)).toBeNull()
  })

  it('reads the browser location when no pathname is given', () => {
    window.history.replaceState(null, '', '/clients/c7')
    expect(clientIdFromPath()).toBe('c7')
  })
})

describe('workoutSlugFromPath', () => {
  it('extracts the slug of a magic-link workout URL', () => {
    expect(workoutSlugFromPath('/p/viviana')).toBe('viviana')
  })

  it('returns null for the slug-less player page', () => {
    expect(workoutSlugFromPath('/workout-player')).toBeNull()
  })
})
