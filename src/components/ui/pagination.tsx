import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { PAGINATION } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  currentPage: number
  totalPages: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void // Reserved for future use
}

function Pagination({
  className,
  currentPage,
  totalPages,
  pageSize: _pageSize,
  total: _total,
  onPageChange,
  onPageSizeChange: _onPageSizeChange,
  ...props
}: PaginationProps) {
  // Calculate start and end items for display (currently unused but available for future use)
  // const startItem = (currentPage - 1) * pageSize + 1
  // const endItem = Math.min(currentPage * pageSize, total)

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    const {
      MAX_VISIBLE_PAGES,
      PAGES_NEAR_START_THRESHOLD,
      PAGES_NEAR_START_MAX,
      PAGES_NEAR_END_THRESHOLD,
      PAGES_NEAR_END_OFFSET,
    } = PAGINATION

    if (totalPages <= MAX_VISIBLE_PAGES) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage <= PAGES_NEAR_START_THRESHOLD) {
        // Near the start
        for (let i = 2; i <= PAGES_NEAR_START_MAX; i++) {
          pages.push(i)
        }
        pages.push("ellipsis")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - PAGES_NEAR_END_THRESHOLD) {
        // Near the end
        pages.push("ellipsis")
        for (let i = totalPages - PAGES_NEAR_END_OFFSET; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // In the middle
        pages.push("ellipsis")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("ellipsis")
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:gap-0">
        {/* TODO: Fix this later, visually it is ugly */}
        {/* <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {total} results
        </div> */}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2">Previous</span>
          </Button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === "ellipsis") {
                return (
                  <Button
                    key={`ellipsis-${index}`}
                    variant="ghost"
                    size="sm"
                    className="pointer-events-none"
                    disabled
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More pages</span>
                  </Button>
                )
              }

              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
          >
            <span className="sr-only sm:not-sr-only sm:mr-2">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  )
}

export { Pagination }
