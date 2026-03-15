import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Textarea } from './Textarea'

describe('Textarea', () => {
  it('renders a textarea', () => {
    render(<Textarea placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('forwards value and onChange', () => {
    const onChange = vi.fn()
    render(<Textarea value="test" onChange={onChange} />)
    fireEvent.change(screen.getByDisplayValue('test'), { target: { value: 'new' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('renders as disabled', () => {
    render(<Textarea disabled data-testid="ta" />)
    expect(screen.getByTestId('ta')).toBeDisabled()
  })

  it('merges custom className', () => {
    render(<Textarea className="min-h-[100px]" data-testid="ta" />)
    expect(screen.getByTestId('ta')).toHaveClass('min-h-[100px]')
  })
})
