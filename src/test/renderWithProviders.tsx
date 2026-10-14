import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'

interface WrapperOptions {
  /** The URL the page is rendered at (pathname, query and hash), as the browser would have it. */
  initialRoute?: string
}

/**
 * Renders a view the way its Astro page does: at a given URL, with no router context.
 *
 * @example
 * renderWithProviders(<ClientDetails />, { initialRoute: '/clients/c1' })
 */
export function renderWithProviders(ui: ReactElement, options?: WrapperOptions & Omit<RenderOptions, 'wrapper'>) {
  const { initialRoute = '/', ...renderOptions } = options ?? {}
  window.history.replaceState(null, '', initialRoute)
  return render(ui, renderOptions)
}
