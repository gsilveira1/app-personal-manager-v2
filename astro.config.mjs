import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { loadEnv } from 'vite'
import { spaFallbackPath } from './src/utils/spaFallback.ts'

// Astro does not copy .env into process.env for this file, so read it explicitly.
const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '')
const apiProxyTarget = process.env.API_PROXY_TARGET ?? env.API_PROXY_TARGET ?? 'http://localhost:9090'

// Dev-only twin of the Nginx SPA fallback: router-only paths get the page that mounts the router.
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
