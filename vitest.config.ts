/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config'

// Astro's own test wiring: the React integration, PostCSS and the PWA virtual modules come from astro.config.mjs.
export default getViteConfig({
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
