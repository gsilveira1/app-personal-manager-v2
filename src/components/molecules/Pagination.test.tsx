import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from './Pagination'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'pagination.showing' && options) {
        return `Showing ${options.start} to ${options.end} of ${options.total} results`
      }
      if (key === 'pagination.showingEmpty') return 'No results'
      if (key === 'pagination.itemsPerPage') return 'Per page'
      if (key === 'pagination.previous') return 'Previous'
      if (key === 'pagination.next') return 'Next'
      return key
    },
  }),
}))

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 3,
    totalItems: 25,
    startIndex: 1,
    endIndex: 10,
    itemsPerPage: 10,
    onPageChange: vi.fn(),
    onItemsPerPageChange: vi.fn(),
  }

  it('renders summary text and controls correctly', () => {
    render(<Pagination {...defaultProps} />)

    expect(screen.getByText('Showing 1 to 10 of 25 results')).toBeInTheDocument()
    expect(screen.getByTestId('pagination-prev')).toBeDisabled()
    expect(screen.getByTestId('pagination-next')).not.toBeDisabled()
    expect(screen.getByTestId('pagination-page-1')).toBeInTheDocument()
    expect(screen.getByTestId('pagination-page-2')).toBeInTheDocument()
    expect(screen.getByTestId('pagination-page-3')).toBeInTheDocument()
  })

  it('calls onPageChange when clicking a page number', () => {
    const onPageChange = vi.fn()
    render(<Pagination {...defaultProps} onPageChange={onPageChange} />)

    fireEvent.click(screen.getByTestId('pagination-page-2'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange when clicking next button', () => {
    const onPageChange = vi.fn()
    render(<Pagination {...defaultProps} currentPage={1} onPageChange={onPageChange} />)

    fireEvent.click(screen.getByTestId('pagination-next'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange when clicking previous button', () => {
    const onPageChange = vi.fn()
    render(<Pagination {...defaultProps} currentPage={2} onPageChange={onPageChange} />)

    fireEvent.click(screen.getByTestId('pagination-prev'))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('calls onItemsPerPageChange when selecting page size option', () => {
    const onItemsPerPageChange = vi.fn()
    render(<Pagination {...defaultProps} onItemsPerPageChange={onItemsPerPageChange} />)

    fireEvent.change(screen.getByTestId('pagination-page-size'), { target: { value: '20' } })
    expect(onItemsPerPageChange).toHaveBeenCalledWith(20)
  })

  it('renders empty message when totalItems is 0', () => {
    render(
      <Pagination
        {...defaultProps}
        totalItems={0}
        startIndex={0}
        endIndex={0}
        totalPages={1}
      />
    )

    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('renders ellipsis for large page counts', () => {
    render(
      <Pagination
        {...defaultProps}
        currentPage={5}
        totalPages={10}
        totalItems={100}
      />
    )

    expect(screen.getAllByText('...').length).toBeGreaterThan(0)
    expect(screen.getByTestId('pagination-page-1')).toBeInTheDocument()
    expect(screen.getByTestId('pagination-page-10')).toBeInTheDocument()
  })
})
