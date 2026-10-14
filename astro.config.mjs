import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { loadEnv } from 'vite'
import { spaFallbackPath } from './src/utils/spaFallback.ts'

// Astro does not copy .env into process.env for this file, so read it explicitly.
const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '')
const apiProxyTarget = process.env.API_PROXY_TARGET ?? env.API_PROXY_TARGET ?? 'http://localhost:9090'

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
  integrations: [react(), spaFallback],
  // Aliases kept from the client-side router; a static redirect page is emitted for each.
  redirects: {
    '/dashboard': '/',
    '/admin/tenants': '/admin/users',
  },
  markdown: { syntaxHighlight: false },
  vite: {
    plugins: [
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        pwaAssets: {
          disabled: false,
          config: true,
        },
        // The manifest is a static file (public/manifest.webmanifest) so the dev server serves it too.
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
