import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-indigo-600')
  })

  it('applies danger variant', () => {
    render(<Button variant="danger">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-red-500')
  })

  it('applies outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveClass('border')
  })

  it('forwards onClick handler', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders as disabled', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('merges custom className', () => {
    render(<Button className="mt-4">Custom</Button>)
    expect(screen.getByRole('button')).toHaveClass('mt-4')
  })
})
