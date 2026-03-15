import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TabBar } from './TabBar'

describe('TabBar', () => {
  const tabs = [
    { id: 'library' as const, label: 'Library' },
    { id: 'ai' as const, label: 'AI Generator' },
  ]

  it('renders all tabs', () => {
    render(<TabBar tabs={tabs} activeTab="library" onChange={vi.fn()} />)
    expect(screen.getByText('Library')).toBeInTheDocument()
    expect(screen.getByText('AI Generator')).toBeInTheDocument()
  })

  it('applies active styling to current tab', () => {
    render(<TabBar tabs={tabs} activeTab="library" onChange={vi.fn()} />)
    expect(screen.getByText('Library')).toHaveClass('bg-white')
  })

  it('calls onChange when a tab is clicked', () => {
    const onChange = vi.fn()
    render(<TabBar tabs={tabs} activeTab="library" onChange={onChange} />)
    fireEvent.click(screen.getByText('AI Generator'))
    expect(onChange).toHaveBeenCalledWith('ai')
  })
})
