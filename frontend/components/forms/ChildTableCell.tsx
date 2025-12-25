"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LinkField } from "./LinkField"

interface ChildTableCellProps {
  field: any
  value: any
  onChange: (value: any) => void
  disabled?: boolean
  rowData?: any
  parentForm?: any
}

export function ChildTableCell({
  field,
  value,
  onChange,
  disabled = false,
  rowData,
  parentForm
}: ChildTableCellProps) {
  
  // Handle read-only/disabled fields
  if (disabled || field.read_only === 1) {
    return (
      <div className="text-sm py-1 px-2 min-h-[32px] flex items-center">
        {formatDisplayValue(value, field)}
      </div>
    )
  }

  // Render appropriate input based on field type
  switch (field.fieldtype) {
    case 'Data':
    case 'Barcode':
    case 'Phone':
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
          placeholder={field.placeholder}
        />
      )

    case 'Password':
      return (
        <Input
          type="password"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
          placeholder={field.placeholder}
        />
      )

    case 'Int':
      return (
        <Input
          type="number"
          step="1"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
          className="h-8 text-sm"
          placeholder={field.placeholder}
        />
      )

    case 'Float':
    case 'Percent':
      return (
        <Input
          type="number"
          step="0.01"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
          className="h-8 text-sm"
          placeholder={field.placeholder}
        />
      )

    case 'Currency':
      return (
        <div className="relative">
          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
            $
          </span>
          <Input
            type="number"
            step="0.01"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
            className="h-8 text-sm pl-6"
            placeholder={field.placeholder}
          />
        </div>
      )

    case 'Date':
      return (
        <Input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
        />
      )

    case 'Datetime':
      return (
        <Input
          type="datetime-local"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
        />
      )

    case 'Time':
      return (
        <Input
          type="time"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
        />
      )

    case 'Check':
      return (
        <div className="flex items-center justify-center h-8">
          <Checkbox
            checked={value === 1 || value === true}
            onCheckedChange={(checked) => onChange(checked ? 1 : 0)}
          />
        </div>
      )

    case 'Select':
      const options = field.options?.split('\n').filter((opt: string) => opt.trim() !== '') || []
      return (
        <Select 
          value={value || undefined} 
          onValueChange={(val) => onChange(val)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder={`Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt: string) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'Link':
      return (
        <LinkField
          value={value || ''}
          onChange={onChange}
          doctype={field.options}
          placeholder={`Select ${field.options}`}
        />
      )

    case 'Text':
    case 'Small Text':
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="text-sm min-h-[60px]"
          placeholder={field.placeholder}
        />
      )

    case 'Long Text':
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="text-sm min-h-[100px]"
          placeholder={field.placeholder}
        />
      )

    case 'Text Editor':
    case 'Code':
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="font-mono text-xs"
          placeholder={field.placeholder}
        />
      )

    case 'Attach':
    case 'Attach Image':
      return (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-sm"
            placeholder="File URL"
            readOnly
          />
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                // TODO: Implement file upload
                console.log('File upload not yet implemented:', file)
              }
            }}
            className="hidden"
            id={`file-${field.fieldname}-${rowData?.idx}`}
          />
          <label
            htmlFor={`file-${field.fieldname}-${rowData?.idx}`}
            className="cursor-pointer text-xs text-primary hover:underline whitespace-nowrap"
          >
            Choose
          </label>
        </div>
      )

    default:
      // Fallback for unknown field types
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
          placeholder={field.fieldtype}
        />
      )
  }
}

// Helper function to format display values for read-only fields
function formatDisplayValue(value: any, field: any): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  switch (field.fieldtype) {
    case 'Check':
      return value === 1 || value === true ? '✓' : ''
    
    case 'Currency':
      return `$${parseFloat(value).toFixed(2)}`
    
    case 'Percent':
      return `${parseFloat(value).toFixed(2)}%`
    
    case 'Float':
      return parseFloat(value).toFixed(2)
    
    case 'Date':
      try {
        return new Date(value).toLocaleDateString()
      } catch {
        return value
      }
    
    case 'Datetime':
      try {
        return new Date(value).toLocaleString()
      } catch {
        return value
      }
    
    default:
      return String(value)
  }
}

