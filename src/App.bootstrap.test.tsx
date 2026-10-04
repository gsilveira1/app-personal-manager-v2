import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// In v7 `react-router-dom` only re-exports `react-router`, but Vitest loads a second copy of it for
// the re-export, and the <BrowserRouter> of one copy never meets the <Routes> of the other.
vi.mock('react-router-dom', () => import('react-router'))

import App from './App'

// Regression: Astro mounts <App /> directly (client:only), so nothing outside the island may be
// required to initialise i18n. An uninitialised instance leaves the views suspended forever
// behind the session-check spinner. Stores, i18n and views are the real ones on purpose.
describe('App bootstrap (mounted the way the Astro island mounts it)', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState(null, '', '/login')
  })

  it('renders the login form without any external i18n setup', async () => {
    render(<App />)

    expect(await screen.findByLabelText(/^(email|e-mail)$/i)).toBeInTheDocument()
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument()
  })
})
