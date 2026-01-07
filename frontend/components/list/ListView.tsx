"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useMeta, useListData, useListCount } from "@/lib/api/hooks"
import { usePermissions } from "@/lib/auth/usePermissions"
import { FilterSidebar } from "./FilterSidebar"
import { StandardFiltersBar } from "./StandardFiltersBar"
import { ListToolbar } from "./ListToolbar"
import { EnhancedDataTable, createSortableHeader } from "./EnhancedDataTable"
import { ListPagination } from "./ListPagination"
import { TableSkeleton } from "@/components/ui/skeleton"
import { ColumnDef } from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useUserSettings } from "@/lib/user-settings/react"
import { saveListFilters, saveListSort, saveLastView } from "@/lib/user-settings/helpers"
import type { FilterTuple } from "@/lib/api/list"
import { dictFiltersToTuples, tuplesToDictFilters } from "@/lib/utils/filters"

interface ListViewProps {
  doctype: string
}

export function ListView({ doctype }: ListViewProps) {
  const params = useParams()
  const workspace = params.workspace ? decodeURIComponent(params.workspace as string) : ''
  
  // Check permissions
  const { canCreate, canDelete } = usePermissions()
  
  // Fetch user_settings for this DocType
  const { data: userSettings } = useUserSettings(doctype)
  
  // Track if settings have been applied (Desk parity: apply once on init)
  const didInitRef = React.useRef(false)
  
  // State management - using dict filters for UI convenience (converted to tuples for API)
  // This matches Desk pattern: UI works with simple objects, API gets tuples
  const [filters, setFilters] = React.useState<Record<string, any>>({})
  const [searchText, setSearchText] = React.useState("")
  const [sortBy, setSortBy] = React.useState("modified")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])

  // Fetch metadata
  const { data: meta, isLoading: metaLoading} = useMeta(doctype)
  
  // Compute fields for list (used by export and data fetch)
  const fields = React.useMemo(() => {
    if (!meta) return ['name']
    const listFields = ['name']
    if (meta.title_field && meta.title_field !== 'name') {
      listFields.push(meta.title_field)
    }
    meta.fields?.forEach((f: any) => {
      if (f.in_list_view && !listFields.includes(f.fieldname)) {
        listFields.push(f.fieldname)
      }
    })
    listFields.push('modified', 'owner', 'creation')
    return listFields.slice(0, 10) // Limit to 10 fields
  }, [meta])
  
  // Apply user_settings once when they load (DESK PARITY)
  React.useEffect(() => {
    if (userSettings?.List && !didInitRef.current) {
      didInitRef.current = true
      
      // Apply saved sort (DESK PARITY: sort_by and sort_order)
      if (userSettings.List.sort_by) {
        setSortBy(userSettings.List.sort_by)
      }
      if (userSettings.List.sort_order) {
        setSortOrder(userSettings.List.sort_order as "asc" | "desc")
      }
      
      // Note: filters would be applied here when we implement Desk filter tuples
    }
  }, [userSettings, doctype])

  // Desk parity: route options (used by Links and other navigations).
  // Apply once on mount, then clear.
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('route_options')
      if (!raw) return
      const opts = JSON.parse(raw)
      if (opts && typeof opts === 'object') {
        setFilters((prev) => ({ ...prev, ...opts }))
      }
      sessionStorage.removeItem('route_options')
    } catch (e) {
      console.warn('[ListView] Failed to apply route_options:', e)
      sessionStorage.removeItem('route_options')
    }
  }, [])
  
  // Save last_view (DESK PARITY: top-level key)
  React.useEffect(() => {
    if (didInitRef.current) {
      saveLastView(doctype, 'List').catch(err => {
        console.error('[ListView] Failed to save last_view:', err)
      })
    }
  }, [doctype])
  
  // Persist sort changes (DESK PARITY: sort_by and sort_order)
  React.useEffect(() => {
    if (!didInitRef.current) return // Don't save during init
    
    saveListSort(doctype, sortBy, sortOrder).catch(err => {
      console.error('[ListView] Failed to save sort:', err)
    })
  }, [sortBy, sortOrder, doctype])

  // Fetch list data
  const { data: listData, isLoading: listLoading, refetch } = useListData({
    doctype,
    filters,
    searchText,
    sortBy,
    sortOrder,
    page: currentPage,
    pageSize,
  })

  // Fetch count for pagination
  const { data: totalCount } = useListCount(doctype, filters)

  // Generate columns from metadata
  const columns: ColumnDef<any>[] = React.useMemo(() => {
    if (!meta || !meta.fields) return []

    const cols: ColumnDef<any>[] = []

    // Name column (always first)
    cols.push({
      accessorKey: "name",
      header: createSortableHeader("ID"),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    })

    // Title field if exists
    if (meta.title_field && meta.title_field !== "name") {
      const titleField = meta.fields.find((f: any) => f.fieldname === meta.title_field)
      if (titleField) {
        cols.push({
          accessorKey: meta.title_field,
          header: createSortableHeader(titleField.label),
          cell: ({ row }) => (
            <div className="max-w-md truncate">
              {row.getValue(meta.title_field)}
            </div>
          ),
        })
      }
    }

    // List view fields
    const listFields = meta.fields
      .filter((f: any) => f.in_list_view === 1 && f.fieldname !== meta.title_field)
      .slice(0, 5) // Limit to 5 additional fields

    listFields.forEach((field: any) => {
      cols.push({
        accessorKey: field.fieldname,
        header: createSortableHeader(field.label),
        cell: ({ row }) => formatCellValue(row.getValue(field.fieldname), field.fieldtype),
      })
    })

    // Standard fields
    cols.push({
      accessorKey: "modified",
      header: createSortableHeader("Modified"),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.getValue("modified")), { addSuffix: true })}
        </div>
      ),
    })

    cols.push({
      accessorKey: "owner",
      header: createSortableHeader("Owner"),
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("owner")}</div>
      ),
    })

    return cols
  }, [meta])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setSelectedRows([])
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
    setSelectedRows([])
  }

  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
    setCurrentPage(1)
    setSelectedRows([])
  }

  const handleSearchChange = (text: string) => {
    setSearchText(text)
    setCurrentPage(1)
    setSelectedRows([])
  }

  const handleBulkDelete = () => {
    // Check permission before allowing delete
    if (!canDelete(doctype)) {
      console.warn('No delete permission for', doctype)
      return
    }
    // TODO: Implement bulk delete
    console.log("Delete selected:", selectedRows)
  }

  if (metaLoading) {
    return (
      <div className="flex-1 p-3 bg-gray-50">
        <TableSkeleton rows={10} columns={6} />
      </div>
    )
  }

  return (
    <div className="flex-1 flex min-h-0">
      {/* Left: Common Filters Sidebar */}
      <FilterSidebar
        doctype={doctype}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Right: Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Standard Filters Bar (DocType-specific) */}
        <StandardFiltersBar
          doctype={doctype}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        {/* Toolbar (Search + Actions) */}
        <ListToolbar
          doctype={doctype}
          module={workspace}
          searchText={searchText}
          onSearchChange={handleSearchChange}
          selectedCount={selectedRows.length}
          totalCount={totalCount || 0}
          currentPage={currentPage}
          pageSize={pageSize}
          onRefresh={refetch}
          onBulkDelete={selectedRows.length > 0 && canDelete(doctype) ? handleBulkDelete : undefined}
          canCreate={canCreate(doctype)}
          filters={filters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          fields={fields}
          selectedRows={selectedRows}
        />

        {/* Data Table - horizontal scroll only when needed */}
        <div className="flex-1 p-3 bg-gray-50 overflow-x-auto">
          <EnhancedDataTable
            data={listData || []}
            columns={columns}
            doctype={doctype}
            module={workspace}
            isLoading={listLoading}
            onSelectionChange={setSelectedRows}
          />
        </div>

        {/* Pagination */}
        {listData && listData.length > 0 && (
          <ListPagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={totalCount || 0}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>
    </div>
  )
}

// Helper to format cell values based on field type with enhanced styling
function formatCellValue(value: any, fieldtype: string) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground text-sm">-</span>
  }

  switch (fieldtype) {
    case "Check":
      return value === 1 ? (
        <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
          Enabled
        </Badge>
      ) : (
        <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
          Disabled
        </Badge>
      )
    
    case "Currency":
      return <div className="font-semibold text-sm">${Number(value).toFixed(2)}</div>
    
    case "Percent":
      return <div className="text-sm">{Number(value).toFixed(2)}%</div>
    
    case "Date":
      try {
        return <div className="text-sm">{new Date(value).toLocaleDateString()}</div>
      } catch {
        return <div className="text-sm">{value}</div>
      }
    
    case "Datetime":
      try {
        return (
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(value), { addSuffix: true })}
          </div>
        )
      } catch {
        return <div className="text-sm">{value}</div>
      }
    
    case "Select":
      // Color-code common statuses
      const statusColors: Record<string, string> = {
        'Enabled': 'bg-green-50 text-green-700 border-green-200',
        'Disabled': 'bg-red-50 text-red-700 border-red-200',
        'Draft': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        'Submitted': 'bg-blue-50 text-blue-700 border-blue-200',
        'Cancelled': 'bg-gray-50 text-gray-700 border-gray-200',
      }
      const colorClass = statusColors[value] || ''
      return <Badge variant="outline" className={colorClass}>{value}</Badge>
    
    case "Link":
      return <div className="text-sm text-primary font-medium">{value}</div>
    
    default:
      return <div className="text-sm max-w-md truncate">{String(value)}</div>
  }
}

