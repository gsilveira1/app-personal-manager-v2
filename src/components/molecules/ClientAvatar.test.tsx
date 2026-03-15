import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClientAvatar } from './ClientAvatar'

describe('ClientAvatar', () => {
  it('renders image when avatar is provided', () => {
    render(<ClientAvatar name="John" avatar="https://example.com/photo.jpg" />)
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('renders initial when no avatar', () => {
    render(<ClientAvatar name="john doe" />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('renders initial when avatar is null', () => {
    render(<ClientAvatar name="Maria" avatar={null} />)
    expect(screen.getByText('M')).toBeInTheDocument()
  })
})
