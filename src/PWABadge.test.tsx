import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockUpdateServiceWorker = vi.fn()

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: mockUpdateServiceWorker,
  })),
}))

import PWABadge from './PWABadge'
import { useRegisterSW } from 'virtual:pwa-register/react'

describe('PWABadge', () => {
  it('renders empty when no notification', () => {
    const { container } = render(<PWABadge />)
    expect(container.querySelector('.PWABadge-toast')).toBeNull()
  })

  it('shows offline ready message', () => {
    vi.mocked(useRegisterSW).mockReturnValue({
      offlineReady: [true, vi.fn()],
      needRefresh: [false, vi.fn()],
      updateServiceWorker: mockUpdateServiceWorker,
    } as any)

    render(<PWABadge />)
    expect(screen.getByText('App ready to work offline')).toBeInTheDocument()
  })

  it('shows refresh message with reload button', () => {
    vi.mocked(useRegisterSW).mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [true, vi.fn()],
      updateServiceWorker: mockUpdateServiceWorker,
    } as any)

    render(<PWABadge />)
    expect(screen.getByText(/New content available/)).toBeInTheDocument()
    expect(screen.getByText('Reload')).toBeInTheDocument()
  })

  it('calls updateServiceWorker on reload click', () => {
    vi.mocked(useRegisterSW).mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [true, vi.fn()],
      updateServiceWorker: mockUpdateServiceWorker,
    } as any)

    render(<PWABadge />)
    fireEvent.click(screen.getByText('Reload'))
    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('close button hides the toast', () => {
    const setOfflineReady = vi.fn()
    const setNeedRefresh = vi.fn()
    vi.mocked(useRegisterSW).mockReturnValue({
      offlineReady: [true, setOfflineReady],
      needRefresh: [false, setNeedRefresh],
      updateServiceWorker: mockUpdateServiceWorker,
    } as any)

    render(<PWABadge />)
    fireEvent.click(screen.getByText('Close'))
    expect(setOfflineReady).toHaveBeenCalledWith(false)
    expect(setNeedRefresh).toHaveBeenCalledWith(false)
  })
})
