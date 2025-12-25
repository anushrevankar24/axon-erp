"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserPlus, User, Tag, Filter as FilterIcon } from "lucide-react"

interface FilterSidebarProps {
  doctype: string
  filters: Record<string, any>
  onFiltersChange: (filters: Record<string, any>) => void
}

export function FilterSidebar({ doctype, filters, onFiltersChange }: FilterSidebarProps) {
  const handleFilterChange = (fieldname: string, value: any) => {
    const newFilters = { ...filters }
    if (value === '' || value === null || value === undefined) {
      delete newFilters[fieldname]
    } else {
      newFilters[fieldname] = value
    }
    onFiltersChange(newFilters)
  }

  return (
    <div className="w-56 border-r bg-gray-50/50 flex flex-col h-full">
      <div className="p-2 border-b bg-white">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-3.5 w-3.5" />
          <h3 className="text-xs font-semibold uppercase tracking-wide">Filter By</h3>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {/* Assigned To */}
          <FilterSection icon={<UserPlus className="h-3.5 w-3.5" />} title="Assigned To">
            <Input
              placeholder="Assignee..."
              value={filters['_assign'] || ''}
              onChange={(e) => handleFilterChange('_assign', e.target.value)}
              className="h-7 text-xs"
            />
          </FilterSection>

          {/* Created By */}
          <FilterSection icon={<User className="h-3.5 w-3.5" />} title="Created By">
            <Input
              placeholder="Creator..."
              value={filters['owner'] || ''}
              onChange={(e) => handleFilterChange('owner', e.target.value)}
              className="h-7 text-xs"
            />
          </FilterSection>

          {/* Tags */}
          <FilterSection icon={<Tag className="h-3.5 w-3.5" />} title="Tags">
            <Input
              placeholder="Tags..."
              value={filters['_user_tags'] || ''}
              onChange={(e) => handleFilterChange('_user_tags', e.target.value)}
              className="h-7 text-xs"
            />
          </FilterSection>

          <Separator className="my-2" />

          {/* Action Buttons */}
          <div className="space-y-1">
            <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs">
              Edit Filters
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs">
              Save Filter
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

function FilterSection({
  icon,
  title,
  children
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded border p-2 space-y-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </Label>
      </div>
      {children}
    </div>
  )
}

