import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiInstructionsSection } from './AiInstructionsSection'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('AiInstructionsSection', () => {
  it('renders with given prompt instructions value, labels, and placeholders', () => {
    const handleChange = vi.fn()
    render(<AiInstructionsSection value="Foque em treinos de hipertrofia" onChange={handleChange} />)

    expect(screen.getAllByText('aiInstructions').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('aiInstructionsPlaceholder')).toBeInTheDocument()
    expect(screen.getByText('autoSave')).toBeInTheDocument()

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('Foque em treinos de hipertrofia')
    expect(textarea).toHaveAttribute('placeholder', 'aiInstructionsPlaceholder')
  })

  it('calls onChange when typing in the textarea', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<AiInstructionsSection value="" onChange={handleChange} />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Novas diretrizes de treino')

    expect(handleChange).toHaveBeenCalled()
    expect(handleChange).toHaveBeenCalledWith(expect.stringContaining('N'))
  })
})
