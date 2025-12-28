"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Plus, RefreshCw, Download, Trash2, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { SPACING, TYPOGRAPHY, COMPONENTS } from "@/lib/design-system"
import { slugify } from "@/lib/utils/workspace"
import { cn } from "@/lib/utils"

interface ListToolbarProps {
  doctype: string
  module: string
  searchText: string
  onSearchChange: (text: string) => void
  selectedCount: number
  totalCount: number
  currentPage: number
  pageSize: number
  onRefresh: () => void
  onBulkDelete?: () => void
  canCreate?: boolean
}

export function ListToolbar({
  doctype,
  module,
  searchText,
  onSearchChange,
  selectedCount,
  totalCount,
  currentPage,
  pageSize,
  onRefresh,
  onBulkDelete,
  canCreate = true
}: ListToolbarProps) {
  const router = useRouter()
  const [debouncedSearch, setDebouncedSearch] = React.useState(searchText)

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(debouncedSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [debouncedSearch, onSearchChange])

  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className={cn(SPACING.containerPaddingX, "py-2.5 flex items-center justify-between", SPACING.sectionGap)}>
        {/* Left: Search - Compact fixed width */}
        <div className="relative w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={`Search ${doctype}...`}
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            className={cn("pl-8", COMPONENTS.inputHeight, TYPOGRAPHY.body)}
          />
        </div>

        {/* Center: Stats - Inline */}
        <div className={cn("flex-1", TYPOGRAPHY.caption)}>
          {totalCount > 0 && `${startIndex}-${endIndex} of ${totalCount}`}
          {selectedCount > 0 && (
            <span className="ml-2 font-medium text-foreground">
              • {selectedCount} selected
            </span>
          )}
        </div>

        {/* Right: Actions - Compact */}
        <div className={cn("flex items-center", SPACING.elementGap)}>
          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={cn(COMPONENTS.buttonHeight, "px-2")}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onBulkDelete} className={cn("text-destructive", TYPOGRAPHY.caption)}>
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Export */}
          <Button variant="ghost" size="sm" className={cn(COMPONENTS.buttonHeight, "px-2")} title="Export">
            <Download className="h-3.5 w-3.5" />
          </Button>

          {/* Refresh */}
          <Button variant="ghost" size="sm" className={cn(COMPONENTS.buttonHeight, "px-2")} onClick={onRefresh} title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          {/* Add New - Only show if user has create permission */}
          {canCreate && (
            <Button 
              size="sm"
              className={cn(COMPONENTS.buttonHeight, TYPOGRAPHY.caption)}
              onClick={() => router.push(`/app/${slugify(doctype)}/new`)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add {doctype}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

