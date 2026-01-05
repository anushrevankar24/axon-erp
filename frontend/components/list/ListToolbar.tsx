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
import { exportReportView } from "@/lib/api/list"
import { dictFiltersToTuples } from "@/lib/utils/filters"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  filters?: Record<string, any>
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  fields?: string[]
  selectedRows?: string[]
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
  canCreate = true,
  filters = {},
  sortBy = 'modified',
  sortOrder = 'desc',
  fields,
  selectedRows = []
}: ListToolbarProps) {
  const router = useRouter()
  const [debouncedSearch, setDebouncedSearch] = useState(searchText)
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(debouncedSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [debouncedSearch, onSearchChange])

  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCount)
  
  // Handle export using Desk's export_query pattern
  const handleExport = (fileFormat: 'CSV' | 'Excel', exportAll: boolean = false) => {
    const filterTuples = dictFiltersToTuples(filters)
    
    exportReportView({
      doctype,
      fields,
      filters: filterTuples,
      order_by: `${sortBy} ${sortOrder}`,
      start: exportAll ? undefined : (currentPage - 1) * pageSize,
      page_length: exportAll ? undefined : pageSize,
      file_format_type: fileFormat,
      title: doctype,
      selected_items: selectedRows.length > 0 ? selectedRows : undefined,
      translate_values: false,
      export_in_background: totalCount > 500, // Background export for large datasets
    })
    
    setShowExportDialog(false)
  }

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
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(COMPONENTS.buttonHeight, "px-2")} 
            title="Export"
            onClick={() => setShowExportDialog(true)}
          >
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
      
      {/* Export Dialog (Desk pattern: choose format and scope) */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export {doctype}</DialogTitle>
            <DialogDescription>
              Choose export format and scope
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Format</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('CSV', false)}
                  className="flex-1"
                >
                  CSV (Current Page)
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('Excel', false)}
                  className="flex-1"
                >
                  Excel (Current Page)
                </Button>
              </div>
            </div>
            
            {totalCount > pageSize && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Export All Rows</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('CSV', true)}
                    className="flex-1"
                  >
                    CSV (All {totalCount} rows)
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('Excel', true)}
                    className="flex-1"
                  >
                    Excel (All {totalCount} rows)
                  </Button>
                </div>
              </div>
            )}
            
            {selectedRows.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Note: {selectedRows.length} selected rows will be exported
              </p>
            )}
            
            {totalCount > 500 && (
              <p className="text-sm text-muted-foreground">
                Large exports will be processed in the background and emailed to you
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

