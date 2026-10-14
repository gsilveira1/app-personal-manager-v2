import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { DYNAMIC_ROUTES, legacyHashPath, spaFallbackPath } from './spaFallback'

describe('spaFallbackPath', () => {
  it.each([
    ['/p/viviana', '/workout-player'],
    ['/p/viviana/', '/workout-player'],
    ['/clients/2bd789b0-893e-4242-bbfd-c223f7f63b8d', '/client-details'],
  ])('serves the page that reads the dynamic segment for %s', (pathname, page) => {
    expect(spaFallbackPath(pathname)).toBe(page)
  })

  it.each(['/', '/clients', '/login', '/api/clients/1', '/_astro/app.js', '/p', '/clients/1/extra/file.js'])('leaves %s alone', (pathname) => {
    expect(spaFallbackPath(pathname)).toBeNull()
  })
})

describe('nginx rewrites', () => {
  const nginx = readFileSync(resolve(process.cwd(), 'docker/nginx/default.conf.template'), 'utf8')

  it.each(DYNAMIC_ROUTES.map(({ page }) => page))('serves %s for the same dynamic path in production', (page) => {
    expect(nginx).toContain(`try_files ${page}/index.html =404;`)
  })

  it('answers unknown paths with the 404 page instead of the dashboard', () => {
    expect(nginx).not.toMatch(/try_files[^;]*\/index\.html;/)
    expect(nginx).toContain('error_page 404 /404.html;')
  })
})

describe('legacyHashPath', () => {
  it('turns an old hash-router link into the path of the page that now serves it', () => {
    expect(legacyHashPath('#/p/viviana?token=abc')).toBe('/p/viviana?token=abc')
    expect(legacyHashPath('#/reset-password?token=a%2Fb')).toBe('/reset-password?token=a%2Fb')
  })

  it('ignores ordinary fragments', () => {
    expect(legacyHashPath('')).toBeNull()
    expect(legacyHashPath('#section')).toBeNull()
    expect(legacyHashPath('#//evil.example')).toBeNull()
  })
})
