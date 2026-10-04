import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3001'

export default defineConfig({
  output: 'static',
  integrations: [react()],
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
        manifest: {
          name: 'Personal Manager PWA',
          short_name: 'PersonalMgr',
          description: 'A comprehensive management tool for personal trainers to handle clients, workouts, schedules, and finances with AI-powered insights.',
          start_url: '/',
          display: 'standalone',
          background_color: '#f8fafc',
          theme_color: '#4f46e5',
          icons: [
            {
              src: '/android-chrome-192x192.png',
              type: 'image/png',
              sizes: '192x192',
            },
            {
              src: '/android-chrome-512x512.png',
              type: 'image/png',
              sizes: '512x512',
            },
          ],
        },
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
