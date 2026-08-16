import { useState, useMemo, useEffect } from 'react'

/**
 * Configuration options for the `usePagination` hook.
 */
export interface UsePaginationOptions {
  /** Initial active page number (1-indexed). Defaults to 1. */
  initialPage?: number
  /** Number of items per page. Defaults to 10. */
  initialItemsPerPage?: number
  /** Allowed options for items per page selector. Defaults to [5, 10, 20, 50]. */
  pageSizeOptions?: number[]
}

/**
 * Return type and API exposed by the `usePagination` hook.
 */
export interface UsePaginationResult<T> {
  /** The subset of items for the active page */
  paginatedItems: T[]
  /** Current active page number (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Total number of items across all pages */
  totalItems: number
  /** Current page size (items per page) */
  itemsPerPage: number
  /** Array of available page size options */
  pageSizeOptions: number[]
  /** 1-indexed index of the first item on the current page */
  startIndex: number
  /** 1-indexed index of the last item on the current page */
  endIndex: number
  /** Function to change current page */
  setPage: (page: number) => void
  /** Function to go to the next page if available */
  nextPage: () => void
  /** Function to go to the previous page if available */
  prevPage: () => void
  /** Function to change items per page */
  setItemsPerPage: (size: number) => void
}

/**
 * Custom hook to manage generic client-side pagination state, item slicing, and page boundaries.
 * Automatically adjusts page number when underlying items count changes.
 *
 * @template T - The type of items being paginated
 * @param items - The complete array of items to paginate
 * @param options - Configuration options for pagination
 * @returns Object containing sliced items and pagination control state
 * @example
 * const { paginatedItems, currentPage, totalPages, setPage } = usePagination(clients, { initialItemsPerPage: 10 })
 */
export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const {
    initialPage = 1,
    initialItemsPerPage = 10,
    pageSizeOptions = [5, 10, 20, 50],
  } = options

  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [itemsPerPage, setItemsPerPageState] = useState<number>(initialItemsPerPage)

  const totalItems = items.length
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / itemsPerPage))
  }, [totalItems, itemsPerPage])

  // Reset to page 1 if current page exceeds maximum allowed pages when items change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const setPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }

  const nextPage = () => {
    setPage(currentPage + 1)
  }

  const prevPage = () => {
    setPage(currentPage - 1)
  }

  const setItemsPerPage = (size: number) => {
    if (size > 0) {
      setItemsPerPageState(size)
      setCurrentPage(1)
    }
  }

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems)

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return items.slice(start, start + itemsPerPage)
  }, [items, currentPage, itemsPerPage])

  return {
    paginatedItems,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    pageSizeOptions,
    startIndex,
    endIndex,
    setPage,
    nextPage,
    prevPage,
    setItemsPerPage,
  }
}
