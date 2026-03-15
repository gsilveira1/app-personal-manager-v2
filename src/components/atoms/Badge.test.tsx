import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge).toHaveClass('bg-slate-100')
  })

  it('renders success variant', () => {
    render(<Badge variant="success">Active</Badge>)
    expect(screen.getByText('Active')).toHaveClass('bg-green-100')
  })

  it('renders warning variant', () => {
    render(<Badge variant="warning">Pending</Badge>)
    expect(screen.getByText('Pending')).toHaveClass('bg-yellow-100')
  })

  it('renders error variant', () => {
    render(<Badge variant="error">Error</Badge>)
    expect(screen.getByText('Error')).toHaveClass('bg-red-100')
  })

  it('merges custom className', () => {
    render(<Badge className="ml-2">Tag</Badge>)
    expect(screen.getByText('Tag')).toHaveClass('ml-2')
  })
})
