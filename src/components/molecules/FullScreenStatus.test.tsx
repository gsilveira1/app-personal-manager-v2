import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FullScreenError, FullScreenLoader } from './FullScreenStatus'

describe('FullScreenLoader', () => {
  it('shows the message next to a spinner', () => {
    render(<FullScreenLoader message="Carregando" />)
    expect(screen.getByTestId('full-screen-loader')).toHaveTextContent('Carregando')
  })
})

describe('FullScreenError', () => {
  const texts = { title: 'Falhou', message: 'Explicação', retry: 'Tentar' }

  it('shows the texts and the technical detail', () => {
    render(<FullScreenError message="HTTP 503" onRetry={() => {}} texts={texts} />)
    expect(screen.getByRole('heading', { name: 'Falhou' })).toBeInTheDocument()
    expect(screen.getByText('Explicação')).toBeInTheDocument()
    expect(screen.getByText('HTTP 503')).toBeInTheDocument()
  })

  it('hides the detail box when there is none and retries on click', () => {
    const onRetry = vi.fn()
    render(<FullScreenError message={null} onRetry={onRetry} texts={texts} />)
    expect(screen.queryByText('HTTP 503')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
