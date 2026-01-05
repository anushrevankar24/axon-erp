"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { UserPlus, User, Tag, Filter as FilterIcon, Loader2, Check, ChevronDown } from "lucide-react"
import { SPACING, TYPOGRAPHY, COMPONENTS, SIDEBAR } from "@/lib/design-system"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { getSidebarStats, getGroupByCount } from "@/lib/api/list"
import { dictFiltersToTuples } from "@/lib/utils/filters"
import { useBoot } from "@/lib/api/hooks"
import { getBootUserId } from "@/lib/utils/boot"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FilterSidebarProps {
  doctype: string
  filters: Record<string, any>
  onFiltersChange: (filters: Record<string, any>) => void
}

export function FilterSidebar({ doctype, filters, onFiltersChange }: FilterSidebarProps) {
  const { data: boot } = useBoot()
  const currentUserId = getBootUserId(boot)
  
  const handleFilterChange = (fieldname: string, value: any) => {
    const newFilters = { ...filters }
    if (value === '' || value === null || value === undefined) {
      delete newFilters[fieldname]
    } else {
      newFilters[fieldname] = value
    }
    onFiltersChange(newFilters)
  }
  
  // Convert filters to tuples (excluding the current filter being queried)
  const getFilterTuplesExcluding = (excludeField: string) => {
    const filteredDict = { ...filters }
    delete filteredDict[excludeField]
    return dictFiltersToTuples(filteredDict)
  }
  
  // Fetch sidebar stats (tags) using Desk API
  // Based on: frappe/public/js/frappe/list/list_sidebar.js::get_stats()
  const filterTuples = dictFiltersToTuples(filters)
  const { data: sidebarStats, isLoading: statsLoading } = useQuery({
    queryKey: ['sidebar-stats', doctype, filterTuples],
    queryFn: () => getSidebarStats(['_user_tags'], doctype, filterTuples),
    enabled: !!doctype,
    staleTime: 60 * 1000, // Cache for 1 minute
  })
  
  const tagStats = sidebarStats?.stats?._user_tags || []
  
  const handleTagClick = (tag: string | null) => {
    // Desk behavior: clicking a tag adds it as a filter
    // "No Tags" is special: uses "not like" with "%,%"
    if (!tag || tag === 'No Tags') {
      handleFilterChange('_user_tags', '') // Clear tags filter to show untagged
    } else {
      handleFilterChange('_user_tags', tag)
    }
  }
  
  // Handle owner (Created By) filter click
  // Based on: frappe/public/js/frappe/list/list_sidebar_group_by.js::apply_filter()
  const handleOwnerClick = (value: string | null) => {
    if (filters['owner'] === value) {
      // Clicking selected item removes filter
      handleFilterChange('owner', undefined)
    } else {
      handleFilterChange('owner', value)
    }
  }
  
  // Handle assign (Assigned To) filter click
  // Based on: frappe/public/js/frappe/list/list_sidebar_group_by.js::apply_filter()
  // Special: _assign uses 'like' operator with % wildcards
  const handleAssignClick = (value: string | null) => {
    if (filters['_assign'] === value) {
      // Clicking selected item removes filter
      handleFilterChange('_assign', undefined)
    } else {
      handleFilterChange('_assign', value)
    }
  }

  return (
    <div className={cn(SIDEBAR.filter.width, "border-r border-gray-200 bg-white flex flex-col h-full")}>
      <div className={cn(SPACING.containerPaddingX, "py-2 border-b border-gray-200")}>
        <div className={cn("flex items-center", SPACING.elementGap)}>
          <FilterIcon className="h-3.5 w-3.5 text-gray-600" />
          <h3 className={TYPOGRAPHY.sectionHeader}>Filter By</h3>
        </div>
      </div>

      {/* ERPNext style: native scroll with transparent track */}
      <div className="flex-1 overflow-y-auto scrollbar-sidebar">
        <div className={cn(SPACING.containerPadding, SPACING.fieldSpacing)}>
          {/* Assigned To - Desk pattern: collapsible dropdown (lazy loaded) */}
          <FilterDropdownSection
            icon={<UserPlus className="h-3.5 w-3.5" />}
            title="Assigned To"
            doctype={doctype}
            field="assigned_to"
            filters={filters}
            currentUserId={currentUserId}
            onFilterClick={handleAssignClick}
            getFilterTuplesExcluding={getFilterTuplesExcluding}
          />

          {/* Created By - Desk pattern: collapsible dropdown (lazy loaded) */}
          <FilterDropdownSection
            icon={<User className="h-3.5 w-3.5" />}
            title="Created By"
            doctype={doctype}
            field="owner"
            filters={filters}
            currentUserId={currentUserId}
            onFilterClick={handleOwnerClick}
            getFilterTuplesExcluding={getFilterTuplesExcluding}
          />

          {/* Tags - Desk pattern: dropdown with stats */}
          <FilterDropdownSection
            icon={<Tag className="h-3.5 w-3.5" />}
            title="Tags"
            doctype={doctype}
            field="tags"
            filters={filters}
            currentUserId={currentUserId}
            onFilterClick={handleTagClick}
            tagStats={tagStats}
            statsLoading={statsLoading}
          />

          <Separator className="my-2" />

          {/* Action Buttons */}
          <div className={SPACING.elementSpacing}>
            <Button variant="ghost" size="sm" className={cn("w-full justify-start", COMPONENTS.buttonHeight, TYPOGRAPHY.caption)}>
              Edit Filters
            </Button>
            <Button variant="ghost" size="sm" className={cn("w-full justify-start", COMPONENTS.buttonHeight, TYPOGRAPHY.caption)}>
              Save Filter
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Desk pattern: collapsible dropdown filter section (lazy loaded on open)
// Based on: frappe/public/js/frappe/list/list_sidebar_group_by.js
function FilterDropdownSection({
  icon,
  title,
  doctype,
  field,
  filters,
  currentUserId,
  onFilterClick,
  getFilterTuplesExcluding,
  tagStats,
  statsLoading
}: {
  icon: React.ReactNode
  title: string
  doctype: string
  field: 'assigned_to' | 'owner' | 'tags'
  filters: Record<string, any>
  currentUserId?: string
  onFilterClick: (value: string | null) => void
  getFilterTuplesExcluding?: (field: string) => any[]
  tagStats?: any[]
  statsLoading?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  
  // Map field to filter key
  const filterKey = field === 'assigned_to' ? '_assign' : field === 'owner' ? 'owner' : '_user_tags'
  const currentFilterValue = filters[filterKey]
  
  // Lazy load options only when dropdown opens (Desk pattern)
  // Based on: frappe/public/js/frappe/list/list_sidebar_group_by.js:100 (show.bs.dropdown event)
  const shouldFetch = open && field !== 'tags'
  const filterTuples = getFilterTuplesExcluding ? getFilterTuplesExcluding(filterKey) : []
  
  const { data: options, isLoading } = useQuery({
    queryKey: ['group-by-count', doctype, field, filterTuples],
    queryFn: () => getGroupByCount({
      doctype,
      current_filters: filterTuples,
      field: field as 'owner' | 'assigned_to',
    }),
    enabled: shouldFetch,
    staleTime: 60 * 1000,
  })
  
  // Use tag stats if provided (for Tags field)
  const displayOptions = field === 'tags' 
    ? (tagStats || []).map(([name, count]: [string, number]) => ({ name, count }))
    : options || []
  
  // Client-side search filtering (Desk pattern: dropdown has search input)
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return displayOptions
    const lowerSearch = searchTerm.toLowerCase()
    return displayOptions.filter(opt => {
      const name = opt.name || 'Not Set'
      const displayName = name === currentUserId ? 'Me' : name
      return displayName.toLowerCase().includes(lowerSearch)
    })
  }, [displayOptions, searchTerm, currentUserId])
  
  return (
    <div className={SPACING.elementSpacing}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "w-full justify-between h-8 font-normal",
              currentFilterValue && "border-primary"
            )}
          >
            <span className="flex items-center gap-2">
              {icon}
              <span className="text-xs">{title}</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="start" 
          className="w-[220px]"
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            setSearchTerm('')
          }}
        >
          {/* Search box (Desk pattern) */}
          <div className="px-2 py-1.5 border-b">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 text-xs"
              autoFocus
            />
          </div>
          
          {/* Loading state */}
          {(isLoading || (field === 'tags' && statsLoading)) && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading...</span>
            </div>
          )}
          
          {/* Options list with counts */}
          {!isLoading && !(field === 'tags' && statsLoading) && (
            <div className="max-h-[300px] overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = currentFilterValue === option.name
                  const displayName = option.name === currentUserId ? 'Me' : (option.name || 'Not Set')
                  
                  return (
                    <DropdownMenuItem
                      key={option.name || 'null'}
                      onClick={() => {
                        onFilterClick(option.name)
                        setOpen(false)
                      }}
                      className={cn(
                        "flex items-center justify-between cursor-pointer",
                        isSelected && "bg-accent"
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-xs">
                        {isSelected && <Check className="h-3 w-3" />}
                        <span className="truncate">{displayName}</span>
                      </span>
                      <span className="text-muted-foreground text-xs ml-2">{option.count}</span>
                    </DropdownMenuItem>
                  )
                })
              ) : (
                <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                  {searchTerm ? 'No matches' : 'No data'}
                </div>
              )}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
