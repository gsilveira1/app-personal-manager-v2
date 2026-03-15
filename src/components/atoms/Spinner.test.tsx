import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('renders with animate-spin class', () => {
    const { container } = render(<Spinner />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('animate-spin')
  })

  it('accepts custom className', () => {
    const { container } = render(<Spinner className="text-indigo-600" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('text-indigo-600')
  })
})
