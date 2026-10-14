import { existsSync } from 'node:fs'
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import pwa from '@vite-pwa/astro'
import { spaFallbackPath } from './src/utils/spaFallback.ts'

// Astro does not copy .env into process.env for this file, so read it with Node's own loader.
// Variables already present in the environment win over the file, as with the dev container.
if (existsSync('.env')) process.loadEnvFile('.env')
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:9090'

// Dev-only twin of the nginx rewrites: paths with a dynamic segment get the page that reads it.
const spaFallback = {
  name: 'spa-fallback',
  hooks: {
    'astro:server:setup': ({ server }) => {
      server.middlewares.use((req, _res, next) => {
        const [pathname, query] = (req.url ?? '').split('?')
        const page = spaFallbackPath(pathname)
        if (page) req.url = query === undefined ? page : `${page}?${query}`
        next()
      })
    },
  },
}

export default defineConfig({
  output: 'static',
  integrations: [
    react(),
    spaFallback,
    // Service worker is generated after the Astro build (astro:build:done), so every page is precached.
    pwa({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // The manifest and its icons are static files in public/ so the dev server serves them too.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        // Multi-page app: every page is precached under its own URL. The default fallback
        // would answer every navigation with index.html (the dashboard) once the worker is installed.
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
  // Aliases kept from the client-side router; a static redirect page is emitted for each.
  redirects: {
    '/dashboard': '/',
    '/admin/tenants': '/admin/users',
  },
  markdown: { syntaxHighlight: false },
  vite: {
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  },
})
