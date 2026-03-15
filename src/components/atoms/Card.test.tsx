import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from './Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('applies base styles', () => {
    render(<Card data-testid="card">Content</Card>)
    expect(screen.getByTestId('card')).toHaveClass('rounded-lg', 'border', 'bg-white')
  })

  it('merges custom className', () => {
    render(<Card className="p-6" data-testid="card">Content</Card>)
    expect(screen.getByTestId('card')).toHaveClass('p-6')
  })
})
