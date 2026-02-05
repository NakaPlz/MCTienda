"use client"

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null

    const getVisiblePages = () => {
        const pages: (number | string)[] = []

        if (totalPages <= 5) {
            // Show all pages if 5 or less
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // Always show first page
            pages.push(1)

            if (currentPage > 3) {
                pages.push('...')
            }

            // Show pages around current
            const start = Math.max(2, currentPage - 1)
            const end = Math.min(totalPages - 1, currentPage + 1)

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) {
                    pages.push(i)
                }
            }

            if (currentPage < totalPages - 2) {
                pages.push('...')
            }

            // Always show last page
            if (!pages.includes(totalPages)) {
                pages.push(totalPages)
            }
        }

        return pages
    }

    const visiblePages = getVisiblePages()

    return (
        <nav className="flex items-center justify-center gap-1 mt-12">
            {/* Previous Button */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Página anterior"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page Numbers */}
            {visiblePages.map((page, index) => (
                <button
                    key={index}
                    onClick={() => typeof page === 'number' && onPageChange(page)}
                    disabled={page === '...'}
                    className={`min-w-[36px] h-9 px-3 rounded border text-sm font-medium transition-colors ${page === currentPage
                            ? 'bg-primary text-primary-foreground border-primary'
                            : page === '...'
                                ? 'border-transparent cursor-default'
                                : 'border-border hover:bg-muted'
                        }`}
                >
                    {page}
                </button>
            ))}

            {/* Next Button */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Página siguiente"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </nav>
    )
}
