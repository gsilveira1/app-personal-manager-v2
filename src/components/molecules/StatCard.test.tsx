import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from './StatCard'
import { Calendar } from 'lucide-react'

describe('StatCard', () => {
  it('renders title, value, and description', () => {
    render(<StatCard title="Sessions" value="12" icon={Calendar} description="This week" />)
    expect(screen.getByText('Sessions')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('This week')).toBeInTheDocument()
  })

  it('applies alert styling when isAlert is true', () => {
    render(<StatCard title="Conflicts" value="3" icon={Calendar} description="Resolve now" isAlert />)
    expect(screen.getByText('Resolve now')).toHaveClass('text-red-500')
  })
})
