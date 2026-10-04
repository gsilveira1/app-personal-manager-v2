import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ManualPaymentModal } from './ManualPaymentModal'
import type { Client } from '../../../types'

describe('ManualPaymentModal', () => {
  const mockClient: Client = {
    id: 'client-1',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '+5511999998888',
    status: 'ACTIVE',
    modality: 'PRESENCIAL',
  }

  it('saves the payment with the contract body: amount, method and period end', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()

    render(<ManualPaymentModal isOpen={true} onClose={onClose} client={mockClient} onSave={onSave} />)

    expect(screen.getByText(/João Silva/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dinheiro' }))
    await user.type(screen.getByLabelText(/Valor Pago/i), '150.5')
    await user.click(screen.getByRole('button', { name: /Confirmar Baixa/i }))

    expect(onSave).toHaveBeenCalledTimes(1)
    const body = onSave.mock.calls[0][0]
    expect(body).toMatchObject({ amount: 150.5, method: 'CASH' })
    expect(body.periodEnd).toMatch(/^\d{4}-\d{2}-\d{2}T23:59:59\.000Z$/)
    // the removed v1 keys must not come back: the API rejects unknown properties
    expect(body).not.toHaveProperty('paymentType')
    expect(body).not.toHaveProperty('validUntil')
    expect(onClose).toHaveBeenCalled()
  })

  it('does not save without an amount, which the API requires', () => {
    const onSave = vi.fn()

    render(<ManualPaymentModal isOpen={true} onClose={vi.fn()} client={mockClient} onSave={onSave} />)

    fireEvent.submit(screen.getByRole('button', { name: /Confirmar Baixa/i }).closest('form')!)

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows the failure and stays open when saving fails', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue(new Error('Client not found'))
    const onClose = vi.fn()

    render(<ManualPaymentModal isOpen={true} onClose={onClose} client={mockClient} onSave={onSave} />)

    await user.type(screen.getByLabelText(/Valor Pago/i), '100')
    await user.click(screen.getByRole('button', { name: /Confirmar Baixa/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Client not found')
    expect(onClose).not.toHaveBeenCalled()
  })
})
