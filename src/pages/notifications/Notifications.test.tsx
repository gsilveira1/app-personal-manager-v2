import '@testing-library/jest-dom'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Notifications } from './Notifications'

vi.mock('../../components/organisms/notifications', () => ({
  WhatsAppConnectionCard: () => <div data-testid="mock-whatsapp-connection-card">WhatsApp Connection Card</div>,
  NotificationAutomationsSection: () => <div data-testid="mock-automations-section">Automations Section</div>,
  NotificationQueueSection: () => <div data-testid="mock-queue-section">Queue Section</div>,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        title: 'Central de Notificações & WhatsApp',
        subtitle: 'Gerencie a conexão da sua instância Evolution API',
        'tabs.connection': 'Conexão WhatsApp',
        'tabs.automations': 'Automações & Modelos',
        'tabs.queue': 'Fila de Envios',
      }
      return translations[key] || key
    },
  }),
}))

describe('Notifications Page', () => {
  it('renders page header and default tab (Connection)', () => {
    render(<Notifications />)

    expect(screen.getByText('Central de Notificações & WhatsApp')).toBeInTheDocument()
    expect(screen.getByTestId('mock-whatsapp-connection-card')).toBeInTheDocument()
    expect(screen.queryByTestId('mock-automations-section')).not.toBeInTheDocument()
    expect(screen.queryByTestId('mock-queue-section')).not.toBeInTheDocument()
  })

  it('switches tabs to automations and queue', async () => {
    const user = userEvent.setup()
    render(<Notifications />)

    // Switch to automations tab
    await user.click(screen.getByTestId('tab-automations'))
    expect(screen.getByTestId('mock-automations-section')).toBeInTheDocument()
    expect(screen.queryByTestId('mock-whatsapp-connection-card')).not.toBeInTheDocument()

    // Switch to queue tab
    await user.click(screen.getByTestId('tab-queue'))
    expect(screen.getByTestId('mock-queue-section')).toBeInTheDocument()
    expect(screen.queryByTestId('mock-automations-section')).not.toBeInTheDocument()
  })
})
