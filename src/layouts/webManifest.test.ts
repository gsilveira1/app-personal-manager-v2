import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const root = process.cwd()
const publicFile = (href: string) => resolve(root, 'public', href.replace(/^\//, ''))

const layout = readFileSync(resolve(root, 'src/layouts/BaseLayout.astro'), 'utf8')
const manifestHref = /<link rel="manifest" href="([^"]+)"/.exec(layout)?.[1] ?? ''

describe('web manifest', () => {
  // Regression: the manifest used to exist only in the build output, so the dev server answered 404.
  it('is linked to a static file that the dev server and the build both serve', () => {
    expect(manifestHref).toBe('/manifest.webmanifest')
    expect(existsSync(publicFile(manifestHref))).toBe(true)
  })

  it('describes an installable app whose icons exist', () => {
    const manifest = JSON.parse(readFileSync(publicFile(manifestHref), 'utf8'))

    expect(manifest).toMatchObject({ name: 'Personal Manager PWA', short_name: 'PersonalMgr', start_url: '/', scope: '/', display: 'standalone', lang: 'en' })
    expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(['192x192', '512x512'])
    for (const icon of manifest.icons) expect(existsSync(publicFile(icon.src))).toBe(true)
  })

  it('is not generated a second time by the PWA plugin', () => {
    const config = readFileSync(resolve(root, 'astro.config.mjs'), 'utf8')
    expect(config).toMatch(/manifest: false/)
  })
})
