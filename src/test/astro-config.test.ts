import { describe, expect, it } from 'vitest'
import config from '../../astro.config.mjs'

type Named = { name?: string }
const names = (items: unknown[] | undefined) => (items ?? []).flat(Number.POSITIVE_INFINITY).map((item) => (item as Named)?.name)

// The service worker is only emitted when the PWA runs as an Astro integration; as a bare Vite plugin
// the Astro build finished without sw.js, so this pins the wiring that the build relies on.
describe('astro.config.mjs', () => {
  it('registers the PWA as an Astro integration, not as a Vite plugin', () => {
    expect(names(config.integrations)).toContain('@vite-pwa/astro-integration')
    expect(names(config.vite?.plugins)).not.toContain('vite-plugin-pwa')
  })

  it('keeps the React integration and the dev rewrite twin of nginx', () => {
    expect(names(config.integrations)).toEqual(expect.arrayContaining(['@astrojs/react', 'spa-fallback']))
  })

  it('proxies /api to the backend in development', () => {
    const proxy = config.vite?.server?.proxy as Record<string, { target: string; changeOrigin: boolean }>
    expect(proxy['/api']).toMatchObject({ changeOrigin: true })
    expect(proxy['/api'].target).toMatch(/^https?:\/\//)
  })
})
