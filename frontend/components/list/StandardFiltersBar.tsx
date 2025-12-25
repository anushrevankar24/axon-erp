"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Filter } from "lucide-react"
import { useMeta } from "@/lib/api/hooks"
import { LinkField } from "../forms/LinkField"

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
    <div className="bg-gradient-to-r from-gray-50 to-white border-b shadow-sm">
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Filters
            </span>
          </div>

          {standardFilters.map((field: any) => (
            <div key={field.fieldname} className="flex items-center gap-1.5 bg-white border rounded-md px-2 py-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {field.label}
              </span>
              {renderStandardFilterInput(field, filters[field.fieldname], (value) =>
                handleFilterChange(field.fieldname, value)
              )}
            </div>
          ))}

          {activeFilterCount > 0 && (
            <>
              <Badge variant="secondary" className="h-5 text-[10px]">
                {activeFilterCount}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs"
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
          <SelectTrigger className="h-6 w-[140px] text-xs border-0 shadow-none">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt: string) => (
              <SelectItem key={opt} value={opt} className="text-xs">
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
          className="h-6 w-[120px] text-xs border-0 shadow-none"
        />
      )

    case 'Check':
      return (
        <Select value={value === undefined ? undefined : String(value)} onValueChange={(v) => onChange(v ? Number(v) : undefined)}>
          <SelectTrigger className="h-6 w-[100px] text-xs border-0 shadow-none">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1" className="text-xs">Yes</SelectItem>
            <SelectItem value="0" className="text-xs">No</SelectItem>
          </SelectContent>
        </Select>
      )

    case 'Date':
      return (
        <Input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-[130px] text-xs border-0 shadow-none"
        />
      )

    default:
      return (
        <Input
          type="text"
          placeholder="All"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-[120px] text-xs border-0 shadow-none"
        />
      )
  }
}

