import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', 'tests', 'dist', '.astro', '.claude'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx,astro}'],
      exclude: [
        'src/test/**',
        'src/**/*.test.*',
        'src/vite-env.d.ts',
        'src/env.d.ts',
        'src/types.ts',
        'src/**/index.ts',
        'src/components/ui.tsx',
        'src/components/AuthLayout.tsx',
        'src/components/Layout.tsx',
        'src/services/mockData.ts',
      ],
    },
  },
})
