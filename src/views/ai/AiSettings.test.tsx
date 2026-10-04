import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiSettings } from './AiSettings'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'pt-BR' } }),
}))

const mockUpdateAiPromptInstructions = vi.fn()

vi.mock('../../states/stores/store', () => ({
  useStore: () => ({
    aiPromptInstructions: 'test instructions',
    updateAiPromptInstructions: mockUpdateAiPromptInstructions,
  }),
}))

describe('AiSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page header', () => {
    render(<AiSettings />)

    expect(screen.getByTestId('ai-settings-page')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'title' })).toBeInTheDocument()
    expect(screen.getByText('subtitle')).toBeInTheDocument()
  })

  it('renders the instructions card with the stored instructions', () => {
    render(<AiSettings />)

    expect(screen.getByRole('heading', { level: 2, name: 'instructions.title' })).toBeInTheDocument()
    expect(screen.getByLabelText('instructions.title')).toHaveValue('test instructions')
  })

  it('renders only sections that exist: no tabs and a single card', () => {
    render(<AiSettings />)

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
  })

  it('calls updateAiPromptInstructions when the textarea changes', async () => {
    const user = userEvent.setup()
    render(<AiSettings />)

    await user.type(screen.getByLabelText('instructions.title'), '!')

    expect(mockUpdateAiPromptInstructions).toHaveBeenCalledWith('test instructions!')
  })
})
