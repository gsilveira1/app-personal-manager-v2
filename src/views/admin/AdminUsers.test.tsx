import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminUsers } from './AdminUsers'
import * as api from '../../services/api/apiService'
import type { AdminUserView } from '../../types'

vi.mock('../../services/api/apiService', () => ({
  getAdminUsers: vi.fn(),
  updateAdminUser: vi.fn(),
}))

const account: AdminUserView = {
  id: 'user-1',
  name: 'Viviana Consultoria',
  email: 'viviana@email.com',
  slug: 'viviana',
  role: 'trainer',
  status: 'ACTIVE',
  studentsCount: 24,
  limits: { maxStudents: 50, canUploadVideos: true, whatsappAlerts: false },
  createdAt: new Date().toISOString(),
}

const page = (items: AdminUserView[]) => ({ items, total: items.length, page: 1, totalPages: 1 })

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the account list with limits', async () => {
    vi.mocked(api.getAdminUsers).mockResolvedValue(page([account]))

    render(<AdminUsers />)

    expect(await screen.findByText('Viviana Consultoria')).toBeInTheDocument()
    expect(screen.getByText('viviana@email.com')).toBeInTheDocument()
    expect(screen.getByText('24 / 50')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('offers no way to create an account (POST /admin/tenants was removed)', async () => {
    vi.mocked(api.getAdminUsers).mockResolvedValue(page([]))

    render(<AdminUsers />)

    expect(await screen.findByText('Nenhuma conta encontrada.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Novo Personal Trainer/i })).not.toBeInTheDocument()
  })

  it('shows the failure instead of an empty list when loading fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.getAdminUsers).mockRejectedValue(new Error('Forbidden resource'))

    render(<AdminUsers />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden resource')
  })

  it('sends status and typed limits on save', async () => {
    const user = userEvent.setup()
    vi.mocked(api.getAdminUsers).mockResolvedValue(page([account]))
    vi.mocked(api.updateAdminUser).mockResolvedValue({ ...account, status: 'BLOCKED' })

    render(<AdminUsers />)

    await user.click(await screen.findByRole('button', { name: /Editar/i }))
    await user.selectOptions(screen.getByLabelText('Status da conta'), 'BLOCKED')
    const maxInput = screen.getByLabelText('Limite de Alunos')
    await user.clear(maxInput)
    await user.type(maxInput, '80')
    await user.click(screen.getByLabelText(/Alertas e Disparos no WhatsApp/i))
    await user.click(screen.getByRole('button', { name: /Salvar Alterações/i }))

    await waitFor(() => {
      expect(api.updateAdminUser).toHaveBeenCalledWith('user-1', {
        status: 'BLOCKED',
        limits: { maxStudents: 80, canUploadVideos: true, whatsappAlerts: true },
      })
    })
  })

  it('keeps the modal open and shows the error when the update is rejected', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(api.getAdminUsers).mockResolvedValue(page([account]))
    vi.mocked(api.updateAdminUser).mockRejectedValue(new Error('limits.maxStudents must be an integer'))

    render(<AdminUsers />)

    await user.click(await screen.findByRole('button', { name: /Editar/i }))
    await user.click(screen.getByRole('button', { name: /Salvar Alterações/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('limits.maxStudents must be an integer')
  })
})
