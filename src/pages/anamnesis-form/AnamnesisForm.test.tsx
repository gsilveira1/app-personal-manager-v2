import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AnamnesisForm } from './AnamnesisForm'
import * as api from '../../services/api/apiService'

vi.mock('../../services/api/apiService', () => ({
  getAnamnesisForm: vi.fn(),
  submitAnamnesis: vi.fn(),
}))

describe('AnamnesisForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders error when token is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/anamnesis']}>
        <AnamnesisForm />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Token de anamnese não informado.')).toBeInTheDocument()
  })

  it('loads and renders form metadata with student and trainer name', async () => {
    vi.mocked(api.getAnamnesisForm).mockResolvedValue({
      studentName: 'Mariana Souza',
      personalName: 'Viviana Personal',
      theme: { primaryColor: '#10B981', logoUrl: null },
    })

    render(
      <MemoryRouter initialEntries={['/anamnesis?token=valid-jwt']}>
        <AnamnesisForm />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Mariana Souza/)).toBeInTheDocument()
    expect(screen.getByText(/Viviana Personal/)).toBeInTheDocument()
  })

  it('submits form successfully', async () => {
    const user = userEvent.setup()
    vi.mocked(api.getAnamnesisForm).mockResolvedValue({
      studentName: 'Mariana Souza',
      personalName: 'Viviana Personal',
      theme: { primaryColor: '#10B981', logoUrl: null },
    })
    vi.mocked(api.submitAnamnesis).mockResolvedValue({
      message: 'Sucesso',
      id: 'anam-1',
    })

    render(
      <MemoryRouter initialEntries={['/anamnesis?token=valid-jwt']}>
        <AnamnesisForm />
      </MemoryRouter>,
    )

    const goalsInput = await screen.findByPlaceholderText(/Ex: Hipertrofia, emagrecimento/i)
    await user.type(goalsInput, 'Hipertrofia e condicionamento')

    const submitBtn = screen.getByRole('button', { name: /Finalizar e Enviar Anamnese/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(api.submitAnamnesis).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'valid-jwt',
          fitnessGoals: 'Hipertrofia e condicionamento',
        }),
      )
    })
  })
})
