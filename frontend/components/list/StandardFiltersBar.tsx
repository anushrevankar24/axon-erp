"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Filter } from "lucide-react"
import { useMeta } from "@/lib/api/hooks"
import { LinkField } from "../forms/LinkField"
import { SPACING, TYPOGRAPHY, COMPONENTS } from "@/lib/design-system"
import { cn } from "@/lib/utils"

interface StandardFiltersBarProps {
  doctype: string
  filters: Record<string, any>
  onFiltersChange: (filters: Record<string, any>) => void
}

export function StandardFiltersBar({
  doctype,
  filters,
  onFiltersChange
}: StandardFiltersBarProps) {
  const { data: meta } = useMeta(doctype)
  
  // Get fields with in_standard_filter = 1
  const standardFilters = React.useMemo(() => {
    if (!meta || !meta.fields) return []
    return meta.fields.filter((f: any) => f.in_standard_filter === 1)
  }, [meta])

  if (standardFilters.length === 0) return null

  const handleFilterChange = (fieldname: string, value: any) => {
    const newFilters = { ...filters }
    if (value === '' || value === null || value === undefined) {
      delete newFilters[fieldname]
    } else {
      newFilters[fieldname] = value
    }
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const activeFilterCount = Object.keys(filters).length

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className={cn(SPACING.containerPaddingX, "py-2")}>
        <div className={cn("flex items-center flex-wrap", SPACING.elementGap)}>
          <div className={cn("flex items-center", SPACING.elementGap)}>
            <Filter className="h-3.5 w-3.5 text-gray-600" />
            <span className={TYPOGRAPHY.filterLabel}>
              Filters
            </span>
          </div>

          {standardFilters.map((field: any) => (
            <div key={field.fieldname} className={cn("flex items-center bg-white border border-gray-200 rounded-md px-2 py-1", SPACING.elementGap)}>
              <span className={cn(TYPOGRAPHY.filterLabel, "whitespace-nowrap")}>
                {field.label}
              </span>
              {renderStandardFilterInput(field, filters[field.fieldname], (value) =>
                handleFilterChange(field.fieldname, value)
              )}
            </div>
          ))}

          {activeFilterCount > 0 && (
            <>
              <Badge variant="secondary" className={cn("h-6", TYPOGRAPHY.caption)}>
                {activeFilterCount}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className={cn(COMPONENTS.buttonHeight, "px-2", TYPOGRAPHY.caption)}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function renderStandardFilterInput(
  field: any,
  value: any,
  onChange: (value: any) => void
) {
  switch (field.fieldtype) {
    case 'Select':
      const options = field.options?.split('\n').filter((o: string) => o.trim()) || []
      return (
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger className={cn(COMPONENTS.selectHeight, "w-[140px]", TYPOGRAPHY.body, "border-0 shadow-none")}>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt: string) => (
              <SelectItem key={opt} value={opt} className={TYPOGRAPHY.caption}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'Link':
      return (
        <div className="w-[160px]">
          <LinkField
            value={value || ''}
            onChange={onChange}
            doctype={field.options}
            placeholder="All"
          />
        </div>
      )

    case 'Data':
      return (
        <Input
          type="text"
          placeholder="All"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={cn(COMPONENTS.inputHeight, "w-[120px]", TYPOGRAPHY.body, "border-0 shadow-none")}
        />
      )

    case 'Check':
      return (
        <Select value={value === undefined ? undefined : String(value)} onValueChange={(v) => onChange(v ? Number(v) : undefined)}>
          <SelectTrigger className={cn(COMPONENTS.selectHeight, "w-[100px]", TYPOGRAPHY.body, "border-0 shadow-none")}>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1" className={TYPOGRAPHY.caption}>Yes</SelectItem>
            <SelectItem value="0" className={TYPOGRAPHY.caption}>No</SelectItem>
          </SelectContent>
        </Select>
      )

    case 'Date':
      return (
        <Input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={cn(COMPONENTS.inputHeight, "w-[130px]", TYPOGRAPHY.body, "border-0 shadow-none")}
        />
      )

    default:
      return (
        <Input
          type="text"
          placeholder="All"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={cn(COMPONENTS.inputHeight, "w-[120px]", TYPOGRAPHY.body, "border-0 shadow-none")}
        />
      )
  }
}

