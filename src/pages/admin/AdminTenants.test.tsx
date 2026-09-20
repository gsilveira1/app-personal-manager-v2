import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminTenants } from './AdminTenants'
import * as api from '../../services/api/apiService'

vi.mock('../../services/api/apiService', () => ({
  getAdminTenants: vi.fn(),
  createAdminTenant: vi.fn(),
  updateAdminTenant: vi.fn(),
}))

describe('AdminTenants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders tenant list', async () => {
    vi.mocked(api.getAdminTenants).mockResolvedValue({
      items: [
        {
          id: 'tenant-1',
          name: 'Viviana Consultoria',
          slug: 'viviana',
          status: 'ACTIVE',
          studentsCount: 24,
          features: { maxStudents: 50, canUploadVideos: true },
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    })

    render(<AdminTenants />)

    expect(await screen.findByText('Viviana Consultoria')).toBeInTheDocument()
    expect(screen.getByText('24 / 50')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('creates new tenant successfully', async () => {
    const user = userEvent.setup()
    vi.mocked(api.getAdminTenants).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      totalPages: 1,
    })
    vi.mocked(api.createAdminTenant).mockResolvedValue({
      id: 't-2',
      name: 'Novo Personal',
      slug: 'novo',
      status: 'ACTIVE',
      studentsCount: 0,
      features: {},
      createdAt: new Date().toISOString(),
    })

    render(<AdminTenants />)

    const newBtn = await screen.findByRole('button', { name: /Novo Personal Trainer/i })
    await user.click(newBtn)

    const nameInput = screen.getByPlaceholderText(/Personal Viviana/i)
    const slugInput = screen.getByPlaceholderText(/^viviana$/i)
    const emailInput = screen.getByPlaceholderText(/viviana@email.com/i)

    await user.type(nameInput, 'Novo Personal')
    await user.type(slugInput, 'novo')
    await user.type(emailInput, 'novo@email.com')

    const submitBtn = screen.getByRole('button', { name: /Criar Tenant/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(api.createAdminTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Novo Personal',
          slug: 'novo',
          email: 'novo@email.com',
        }),
      )
    })
  })
})
