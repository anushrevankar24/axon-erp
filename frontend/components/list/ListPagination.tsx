"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { SPACING, TYPOGRAPHY, COMPONENTS } from "@/lib/design-system"
import { cn } from "@/lib/utils"

interface ListPaginationProps {
  currentPage: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function ListPagination({
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: ListPaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize)
  const canPreviousPage = currentPage > 1
  const canNextPage = currentPage < totalPages

  const pageSizes = [20, 50, 100, 500]

  return (
    <div className={cn("flex items-center justify-between border-t border-gray-200 bg-white", SPACING.containerPaddingX, "py-2.5")}>
      <div className={cn("flex items-center", SPACING.sectionGap)}>
        {/* Page Size Selector */}
        <div className={cn("flex items-center", SPACING.elementGap)}>
          <span className={TYPOGRAPHY.caption}>Rows</span>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className={cn(COMPONENTS.selectHeight, "w-[60px]", TYPOGRAPHY.body)}>
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizes.map((size) => (
                <SelectItem key={size} value={`${size}`} className={TYPOGRAPHY.caption}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page Info */}
        <div className={TYPOGRAPHY.caption}>
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className={cn("flex items-center", SPACING.elementGap)}>
        <Button
          variant="ghost"
          size="icon"
          className={cn(COMPONENTS.buttonHeight, "w-8")}
          onClick={() => onPageChange(1)}
          disabled={!canPreviousPage}
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(COMPONENTS.buttonHeight, "w-8")}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPreviousPage}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(COMPONENTS.buttonHeight, "w-8")}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNextPage}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(COMPONENTS.buttonHeight, "w-8")}
          onClick={() => onPageChange(totalPages)}
          disabled={!canNextPage}
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

