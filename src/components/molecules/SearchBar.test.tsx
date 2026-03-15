import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchBar } from './SearchBar'

describe('SearchBar', () => {
  it('renders with placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Search clients..." />)
    expect(screen.getByPlaceholderText('Search clients...')).toBeInTheDocument()
  })

  it('calls onChange with new value', () => {
    const onChange = vi.fn()
    render(<SearchBar value="" onChange={onChange} placeholder="Search" />)
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'John' } })
    expect(onChange).toHaveBeenCalledWith('John')
  })
})
