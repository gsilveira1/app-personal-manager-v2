import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('forwards value and onChange', () => {
    const onChange = vi.fn()
    render(<Input value="test" onChange={onChange} />)
    fireEvent.change(screen.getByDisplayValue('test'), { target: { value: 'new' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('renders as disabled', () => {
    render(<Input disabled data-testid="input" />)
    expect(screen.getByTestId('input')).toBeDisabled()
  })

  it('merges custom className', () => {
    render(<Input className="mt-4" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveClass('mt-4')
  })
})
