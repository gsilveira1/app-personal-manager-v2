import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../atoms'

/**
 * Props for the `Pagination` component.
 */
export interface PaginationProps {
  /** Current active page number (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Total count of items across all pages */
  totalItems: number
  /** Start item index (1-indexed) displayed on current page */
  startIndex: number
  /** End item index (1-indexed) displayed on current page */
  endIndex: number
  /** Current page size */
  itemsPerPage: number
  /** Options available for page size selection */
  pageSizeOptions?: number[]
  /** Callback fired when page number changes */
  onPageChange: (page: number) => void
  /** Callback fired when items per page selection changes */
  onItemsPerPageChange?: (size: number) => void
  /** Custom container class name */
  className?: string
}

/**
 * Generic pagination component providing accessible page numbers, navigation buttons,
 * item summary count, and page size selection.
 *
 * @param props - Component props specified by {@link PaginationProps}
 * @returns React functional component rendering pagination controls
 * @example
 * <Pagination
 *   currentPage={1}
 *   totalPages={5}
 *   totalItems={48}
 *   startIndex={1}
 *   endIndex={10}
 *   itemsPerPage={10}
 *   onPageChange={(page) => setPage(page)}
 *   onItemsPerPageChange={(size) => setItemsPerPage(size)}
 * />
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  itemsPerPage,
  pageSizeOptions = [5, 10, 20, 50],
  onPageChange,
  onItemsPerPageChange,
  className = '',
}) => {
  const { t } = useTranslation('common')

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      if (currentPage > 3) {
        pages.push('...')
      }
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) {
        pages.push('...')
      }
      pages.push(totalPages)
    }
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div
      data-testid="pagination-container"
      className={`px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm ${className}`}
    >
      {/* Information text */}
      <div className="text-slate-600 text-xs sm:text-sm">
        {totalItems > 0
          ? t('pagination.showing', { start: startIndex, end: endIndex, total: totalItems })
          : t('pagination.showingEmpty')}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Items per page selector */}
        {onItemsPerPageChange && (
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-600">
            <span>{t('pagination.itemsPerPage')}:</span>
            <select
              data-testid="pagination-page-size"
              aria-label={t('pagination.itemsPerPage')}
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page stepper controls */}
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            data-testid="pagination-prev"
            aria-label={t('pagination.previous')}
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pageNumbers.map((page, idx) =>
            typeof page === 'number' ? (
              <Button
                key={idx}
                variant={page === currentPage ? 'primary' : 'ghost'}
                size="sm"
                data-testid={`pagination-page-${page}`}
                onClick={() => onPageChange(page)}
                className={`h-8 min-w-[2rem] px-2 text-xs ${
                  page === currentPage ? 'bg-indigo-600 text-white font-medium' : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                {page}
              </Button>
            ) : (
              <span key={idx} className="px-1 text-slate-400 text-xs select-none">
                {page}
              </span>
            )
          )}

          <Button
            variant="outline"
            size="sm"
            data-testid="pagination-next"
            aria-label={t('pagination.next')}
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
