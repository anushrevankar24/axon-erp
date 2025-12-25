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
  onBulkDelete
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
    <div className="border-b bg-white">
      <div className="px-3 py-2 flex items-center justify-between gap-3">
        {/* Left: Search - Compact fixed width */}
        <div className="relative w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={`Search ${doctype}...`}
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>

        {/* Center: Stats - Inline */}
        <div className="flex-1 text-xs text-muted-foreground">
          {totalCount > 0 && `${startIndex}-${endIndex} of ${totalCount}`}
          {selectedCount > 0 && (
            <span className="ml-2 font-medium text-foreground">
              • {selectedCount} selected
            </span>
          )}
        </div>

        {/* Right: Actions - Compact */}
        <div className="flex items-center gap-1">
          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onBulkDelete} className="text-destructive text-xs">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Export */}
          <Button variant="ghost" size="sm" className="h-7 px-2" title="Export">
            <Download className="h-3.5 w-3.5" />
          </Button>

          {/* Refresh */}
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onRefresh} title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          {/* Add New */}
          <Button 
            size="sm"
            className="h-7 text-xs"
            onClick={() => router.push(`/app/${module}/${encodeURIComponent(doctype)}/new`)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add {doctype}
          </Button>
        </div>
      </div>
    </div>
  )
}

