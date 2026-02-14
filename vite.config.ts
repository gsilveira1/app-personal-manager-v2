import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    injectRegister: false,
     
    pwaAssets: {
      disabled: false,
      config: true,
    },

    manifest: {
      "name": "Personal Manager PWA",
      "short_name": "PersonalMgr",
      "description": "A comprehensive management tool for personal trainers to handle clients, workouts, schedules, and finances with AI-powered insights.",
      "start_url": "/",
      "display": "standalone",
      "background_color": "#f8fafc",
      "theme_color": "#4f46e5",
      "icons": [
        {
          "src": "/icon-192.png",
          "type": "image/png",
          "sizes": "192x192"
        },
        {
          "src": "/icon-512.png",
          "type": "image/png",
          "sizes": "512x512"
        }
      ]
    },

    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
    },

    devOptions: {
      enabled: false,
      navigateFallback: 'index.html',
      suppressWarnings: true,
      type: 'module',
    },
  })],
})