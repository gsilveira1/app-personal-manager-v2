export const API_URL = process.env.VITE_API_URL ?? 'http://localhost:9090/api'
export const BASE_URL = process.env.VITE_BASE_URL ?? 'http://localhost:4321'
export const TEST_EMAIL = process.env.VITE_TEST_EMAIL ?? 'admin@gym.com'
export const TEST_PASSWORD = process.env.VITE_TEST_PASSWORD ?? 'admin123'
/**
 * A second seeded account. Specs that change account-wide settings (the UI language)
 * use it, so they cannot change what the specs sharing TEST_EMAIL see while they run.
 */
export const SETTINGS_TEST_EMAIL = process.env.VITE_SETTINGS_TEST_EMAIL ?? 'carlos@elitefit.com'
export const SETTINGS_TEST_PASSWORD = process.env.VITE_SETTINGS_TEST_PASSWORD ?? 'admin123'
