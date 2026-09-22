import '@testing-library/jest-dom'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Notifications } from './Notifications'

vi.mock('../../components/organisms/notifications', () => ({
  NotificationQueueSection: () => <div data-testid="mock-queue-section">Notification Queue Section</div>,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        title: 'Central de Notificações & WhatsApp',
        subtitle: 'Gerencie a fila de disparos e histórico de notificações.',
      }
      return translations[key] || key
    },
  }),
}))

describe('Notifications Page', () => {
  it('renders page header and queue section directly', () => {
    render(<Notifications />)

    expect(screen.getByText('Central de Notificações & WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('Gerencie a fila de disparos e histórico de notificações.')).toBeInTheDocument()
    expect(screen.getByTestId('mock-queue-section')).toBeInTheDocument()
  })
})
