import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

import LoginIsland from './LoginIsland'

// Regression: Astro mounts the island directly (client:only), so nothing outside it may be
// required to initialise i18n. An uninitialised instance leaves the view suspended forever
// behind the session-check spinner. Stores, i18n and the view are the real ones on purpose.
describe('LoginIsland (mounted the way the Astro page mounts it)', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState(null, '', '/login')
  })

  it('renders the login form without any external i18n setup', async () => {
    render(<LoginIsland />)

    expect(await screen.findByLabelText(/^(email|e-mail)$/i)).toBeInTheDocument()
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument()
  })
})
