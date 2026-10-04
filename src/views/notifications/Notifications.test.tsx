import '@testing-library/jest-dom'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { Notifications } from './Notifications'

vi.mock('../../components/organisms/notifications', () => ({
  NotificationQueueSection: () => <div data-testid="mock-queue-section">Notification Queue Section</div>,
  WhatsAppConnectionCard: () => <div data-testid="mock-whatsapp-card">WhatsApp Connection Card</div>,
  NotificationAutomationsSection: () => <div data-testid="mock-automations-section">Automations Section</div>,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        title: 'Central de Notificações & WhatsApp',
        subtitle: 'Gerencie a fila de disparos e histórico de notificações.',
        'tabs.queue': 'Fila de Disparos',
        'tabs.whatsapp': 'Conexão WhatsApp',
        'tabs.automations': 'Automações',
      }
      return translations[key] || key
    },
  }),
}))

const LocationProbe = () => <output data-testid="location-search">{useLocation().search}</output>

const renderAt = (entry = '/notifications') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Notifications />
      <LocationProbe />
    </MemoryRouter>
  )

const expectOnlyMounted = (testId: string) => {
  for (const id of ['mock-queue-section', 'mock-whatsapp-card', 'mock-automations-section']) {
    if (id === testId) expect(screen.getByTestId(id)).toBeInTheDocument()
    else expect(screen.queryByTestId(id)).not.toBeInTheDocument()
  }
}

describe('Notifications Page', () => {
  it('renders the page header', () => {
    renderAt()

    expect(screen.getByTestId('notifications-page')).toBeInTheDocument()
    expect(screen.getByText('Central de Notificações & WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('Gerencie a fila de disparos e histórico de notificações.')).toBeInTheDocument()
  })

  it('renders the three tabs with the queue selected by default', () => {
    renderAt()

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Fila de Disparos', 'Conexão WhatsApp', 'Automações'])
    expect(screen.getByRole('tab', { name: 'Fila de Disparos' })).toHaveAttribute('aria-selected', 'true')
    expectOnlyMounted('mock-queue-section')
  })

  it('labels the tab panel with the active tab', () => {
    renderAt('/notifications?tab=automations')

    expect(screen.getByRole('tabpanel', { name: 'Automações' })).toContainElement(screen.getByTestId('mock-automations-section'))
  })

  it('switches to the WhatsApp connection tab and records it in the URL', async () => {
    const user = userEvent.setup()
    renderAt()

    await user.click(screen.getByRole('tab', { name: 'Conexão WhatsApp' }))

    expect(screen.getByRole('tab', { name: 'Conexão WhatsApp' })).toHaveAttribute('aria-selected', 'true')
    expectOnlyMounted('mock-whatsapp-card')
    expect(screen.getByTestId('location-search')).toHaveTextContent('?tab=whatsapp')
  })

  it('switches to the automations tab', async () => {
    const user = userEvent.setup()
    renderAt()

    await user.click(screen.getByRole('tab', { name: 'Automações' }))

    expectOnlyMounted('mock-automations-section')
    expect(screen.getByTestId('location-search')).toHaveTextContent('?tab=automations')
  })

  it('drops the tab parameter when returning to the default tab', async () => {
    const user = userEvent.setup()
    renderAt('/notifications?tab=whatsapp')

    await user.click(screen.getByRole('tab', { name: 'Fila de Disparos' }))

    expectOnlyMounted('mock-queue-section')
    expect(screen.getByTestId('location-search')).toBeEmptyDOMElement()
  })

  it.each([
    ['whatsapp', 'mock-whatsapp-card'],
    ['automations', 'mock-automations-section'],
    ['queue', 'mock-queue-section'],
  ])('opens the %s tab from a ?tab= deep link', (tab, testId) => {
    renderAt(`/notifications?tab=${tab}`)

    expectOnlyMounted(testId)
  })

  it('falls back to the queue tab for an unknown tab value', () => {
    renderAt('/notifications?tab=nope')

    expect(screen.getByRole('tab', { name: 'Fila de Disparos' })).toHaveAttribute('aria-selected', 'true')
    expectOnlyMounted('mock-queue-section')
  })
})
