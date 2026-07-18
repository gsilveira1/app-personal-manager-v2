import { test as setup, expect } from '@playwright/test'
import { API_URL, TEST_EMAIL, TEST_PASSWORD } from './helpers/constants'

setup('authenticate', async ({ page }) => {
  // 1. Login via API to get JWT token
  const res = await page.request.post(`${API_URL}/auth/login`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  })
  expect(res.ok()).toBeTruthy()

  const { access_token, user } = await res.json()

  // 2. Navigate to the app so we can set localStorage on the correct origin
  await page.goto('http://localhost:5173/#/login')

  // 3. Inject token + user into localStorage (this is how the app authenticates)
  await page.evaluate(
    ({ token, userData }) => {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
    },
    { token: access_token, userData: user },
  )

  // 4. Save storage state for reuse by all authenticated tests
  await page.context().storageState({ path: 'e2e/.auth/user.json' })
})
