import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModalShell } from './ModalShell'

describe('ModalShell', () => {
  it('renders title and children', () => {
    render(
      <ModalShell title="Test Modal" onClose={vi.fn()}>
        <p>Body content</p>
      </ModalShell>
    )
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <ModalShell title="Modal" onClose={onClose}>
        <p>Content</p>
      </ModalShell>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders with custom maxWidth', () => {
    const { container } = render(
      <ModalShell title="Wide" onClose={vi.fn()} maxWidth="max-w-lg">
        <p>Content</p>
      </ModalShell>
    )
    expect(container.querySelector('.max-w-lg')).toBeInTheDocument()
  })
})
