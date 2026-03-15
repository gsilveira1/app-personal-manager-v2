import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'
import { Users } from 'lucide-react'

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState icon={Users} title="No clients found" />)
    expect(screen.getByText('No clients found')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<EmptyState icon={Users} title="Empty" description="Add your first client" />)
    expect(screen.getByText('Add your first client')).toBeInTheDocument()
  })

  it('renders action when provided', () => {
    render(<EmptyState icon={Users} title="Empty" action={<button>Add</button>} />)
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })
})
