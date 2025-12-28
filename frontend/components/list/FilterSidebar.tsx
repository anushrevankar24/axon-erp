"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { UserPlus, User, Tag, Filter as FilterIcon } from "lucide-react"
import { SPACING, TYPOGRAPHY, COMPONENTS, SIDEBAR } from "@/lib/design-system"
import { cn } from "@/lib/utils"

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
          {/* Assigned To */}
          <FilterSection icon={<UserPlus className="h-3.5 w-3.5" />} title="Assigned To">
            <Input
              placeholder="Assignee..."
              value={filters['_assign'] || ''}
              onChange={(e) => handleFilterChange('_assign', e.target.value)}
              className={cn(COMPONENTS.inputHeight, TYPOGRAPHY.body)}
            />
          </FilterSection>

          {/* Created By */}
          <FilterSection icon={<User className="h-3.5 w-3.5" />} title="Created By">
            <Input
              placeholder="Creator..."
              value={filters['owner'] || ''}
              onChange={(e) => handleFilterChange('owner', e.target.value)}
              className={cn(COMPONENTS.inputHeight, TYPOGRAPHY.body)}
            />
          </FilterSection>

          {/* Tags */}
          <FilterSection icon={<Tag className="h-3.5 w-3.5" />} title="Tags">
            <Input
              placeholder="Tags..."
              value={filters['_user_tags'] || ''}
              onChange={(e) => handleFilterChange('_user_tags', e.target.value)}
              className={cn(COMPONENTS.inputHeight, TYPOGRAPHY.body)}
            />
          </FilterSection>

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
    <div className={cn(COMPONENTS.border, COMPONENTS.borderRadius, SPACING.elementSpacing, "p-2")}>
      <div className={cn("flex items-center", SPACING.elementGap)}>
        {icon}
        <Label className={TYPOGRAPHY.filterLabel}>
          {title}
        </Label>
      </div>
      {children}
    </div>
  )
}

