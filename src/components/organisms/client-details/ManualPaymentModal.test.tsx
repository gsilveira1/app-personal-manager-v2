import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ManualPaymentModal } from './ManualPaymentModal'
import type { Client } from '../../../types'

describe('ManualPaymentModal', () => {
  const mockClient: Client = {
    id: 'client-1',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '+5511999998888',
    status: 'Active' as any,
    type: 'In-Person',
  }

  it('renders modal with client name and saves payment', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()

    render(<ManualPaymentModal isOpen={true} onClose={onClose} client={mockClient} onSave={onSave} />)

    expect(screen.getByText(/João Silva/)).toBeInTheDocument()

    const pixBtn = screen.getByRole('button', { name: 'Pix' })
    expect(pixBtn).toBeInTheDocument()

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Baixa/i })
    await user.click(confirmBtn)

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentType: 'MANUAL_PIX',
      })
    )
  })
})
