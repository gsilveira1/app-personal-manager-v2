import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite';

/**
 * Carrega as variáveis do arquivo .env com base no modo atual.
 * Por padrão, busca no diretório atual (process.cwd()).
 * O primeiro parâmetro representa o modo (ex: 'development', 'staging', ou vazio '' para ler o padrão).
 */
const envs = loadEnv('', process.cwd(), 'VITE_');

// Injeta as variáveis VITE_ lidas diretamente no process.env global do Node.js
Object.assign(process.env, envs);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30_000,
  use: {
    baseURL: process.env.VITE_BASE_URL ?? 'http://localhost:5173',
    actionTimeout: 10_000,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
