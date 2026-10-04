import { describe, it, expect } from 'vitest'
import { legacyHashPath, spaFallbackPath } from './spaFallback'

describe('spaFallbackPath', () => {
  it.each([
    ['/p/viviana', '/workout-player'],
    ['/p/viviana/', '/workout-player'],
    ['/clients/2bd789b0-893e-4242-bbfd-c223f7f63b8d', '/client-details'],
  ])('serves the page that mounts the router for %s', (pathname, page) => {
    expect(spaFallbackPath(pathname)).toBe(page)
  })

  it.each(['/', '/clients', '/login', '/api/clients/1', '/_astro/app.js', '/p', '/clients/1/extra/file.js'])('leaves %s alone', (pathname) => {
    expect(spaFallbackPath(pathname)).toBeNull()
  })
})

describe('legacyHashPath', () => {
  it('turns an old hash-router link into the path the browser router understands', () => {
    expect(legacyHashPath('#/p/viviana?token=abc')).toBe('/p/viviana?token=abc')
    expect(legacyHashPath('#/reset-password?token=a%2Fb')).toBe('/reset-password?token=a%2Fb')
  })

  it('ignores ordinary fragments', () => {
    expect(legacyHashPath('')).toBeNull()
    expect(legacyHashPath('#section')).toBeNull()
    expect(legacyHashPath('#//evil.example')).toBeNull()
  })
})
