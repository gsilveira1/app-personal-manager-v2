import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  const mockItems = Array.from({ length: 25 }, (_, i) => `Item ${i + 1}`)

  it('initializes with default options', () => {
    const { result } = renderHook(() => usePagination(mockItems))

    expect(result.current.currentPage).toBe(1)
    expect(result.current.itemsPerPage).toBe(10)
    expect(result.current.totalItems).toBe(25)
    expect(result.current.totalPages).toBe(3)
    expect(result.current.startIndex).toBe(1)
    expect(result.current.endIndex).toBe(10)
    expect(result.current.paginatedItems.length).toBe(10)
    expect(result.current.paginatedItems[0]).toBe('Item 1')
    expect(result.current.paginatedItems[9]).toBe('Item 10')
  })

  it('slices items correctly on page change', () => {
    const { result } = renderHook(() => usePagination(mockItems, { initialItemsPerPage: 10 }))

    act(() => {
      result.current.setPage(2)
    })

    expect(result.current.currentPage).toBe(2)
    expect(result.current.startIndex).toBe(11)
    expect(result.current.endIndex).toBe(20)
    expect(result.current.paginatedItems.length).toBe(10)
    expect(result.current.paginatedItems[0]).toBe('Item 11')
    expect(result.current.paginatedItems[9]).toBe('Item 20')
  })

  it('handles last page with remaining items', () => {
    const { result } = renderHook(() => usePagination(mockItems, { initialItemsPerPage: 10 }))

    act(() => {
      result.current.setPage(3)
    })

    expect(result.current.currentPage).toBe(3)
    expect(result.current.startIndex).toBe(21)
    expect(result.current.endIndex).toBe(25)
    expect(result.current.paginatedItems.length).toBe(5)
    expect(result.current.paginatedItems[0]).toBe('Item 21')
    expect(result.current.paginatedItems[4]).toBe('Item 25')
  })

  it('navigates using nextPage and prevPage', () => {
    const { result } = renderHook(() => usePagination(mockItems, { initialItemsPerPage: 10 }))

    act(() => {
      result.current.nextPage()
    })
    expect(result.current.currentPage).toBe(2)

    act(() => {
      result.current.prevPage()
    })
    expect(result.current.currentPage).toBe(1)
  })

  it('clamps page values to valid range', () => {
    const { result } = renderHook(() => usePagination(mockItems, { initialItemsPerPage: 10 }))

    act(() => {
      result.current.setPage(99)
    })
    expect(result.current.currentPage).toBe(3)

    act(() => {
      result.current.setPage(-5)
    })
    expect(result.current.currentPage).toBe(1)
  })

  it('updates items per page and resets to page 1', () => {
    const { result } = renderHook(() => usePagination(mockItems, { initialItemsPerPage: 10 }))

    act(() => {
      result.current.setPage(2)
    })
    expect(result.current.currentPage).toBe(2)

    act(() => {
      result.current.setItemsPerPage(5)
    })

    expect(result.current.itemsPerPage).toBe(5)
    expect(result.current.currentPage).toBe(1)
    expect(result.current.totalPages).toBe(5)
    expect(result.current.paginatedItems.length).toBe(5)
  })

  it('handles empty items array gracefully', () => {
    const { result } = renderHook(() => usePagination([]))

    expect(result.current.currentPage).toBe(1)
    expect(result.current.totalItems).toBe(0)
    expect(result.current.totalPages).toBe(1)
    expect(result.current.startIndex).toBe(0)
    expect(result.current.endIndex).toBe(0)
    expect(result.current.paginatedItems).toEqual([])
  })

  it('adjusts page when items list shrinks below current page range', () => {
    let items = mockItems
    const { result, rerender } = renderHook(() => usePagination(items, { initialItemsPerPage: 10 }))

    act(() => {
      result.current.setPage(3)
    })
    expect(result.current.currentPage).toBe(3)

    // Shrink items to only 5 items
    items = mockItems.slice(0, 5)
    rerender()

    expect(result.current.currentPage).toBe(1)
    expect(result.current.totalPages).toBe(1)
    expect(result.current.paginatedItems.length).toBe(5)
  })
})
