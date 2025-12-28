/**
 * Field Renderer Component - ERPNext Pattern
 * 
 * Renders form fields based on DocField metadata.
 * Includes:
 * - Error state styling (has-error class)
 * - Time format fix (truncate microseconds)
 * - Scroll-to-field support via data attributes
 * 
 * Based on: frappe/public/js/frappe/form/controls/base_input.js
 */

import * as React from 'react'
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LinkField } from './LinkField'
import { ChildTable } from './ChildTable'
import { cn } from '@/lib/utils'
import { useFieldPermissions } from '@/lib/hooks/useFieldPermissions'
import { DocTypeMeta } from '@/lib/types/metadata'

// ============================================================================
// Types
// ============================================================================

interface FieldMeta {
  fieldname: string
  fieldtype: string
  label: string
  reqd?: number | boolean
  read_only?: number | boolean
  hidden?: number | boolean
  options?: string
  description?: string
  length?: number
  default?: any
}

interface FieldRendererProps {
  field: FieldMeta
  form: any // UseFormReturn from react-hook-form
  doc: any  // Current document
  meta?: DocTypeMeta  // DocType metadata
}

// ============================================================================
// Time Format Utilities
// ============================================================================

/**
 * Format time value for HTML input
 * Frappe stores time with microseconds (e.g., "23:38:26.612415")
 * HTML <input type="time"> only accepts up to milliseconds (HH:mm:ss.SSS)
 */
function formatTimeForInput(value: string | null | undefined): string {
  if (!value) return ''
  
  // Handle full datetime strings
  if (value.includes(' ')) {
    value = value.split(' ')[1]
  }
  
  // Truncate microseconds to milliseconds
  // "23:38:26.612415" -> "23:38:26.612" or "23:38:26"
  const match = value.match(/^(\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?/)
  if (match) {
    return match[1] // Return just HH:mm:ss
  }
  
  return value
}

/**
 * Format datetime value for HTML input
 * Frappe stores datetime with microseconds and space separator
 */
function formatDatetimeForInput(value: string | null | undefined): string {
  if (!value) return ''
  
  // Replace space with T for HTML datetime-local input
  // "2024-01-15 23:38:26.612415" -> "2024-01-15T23:38:26"
  const parts = value.split(' ')
  if (parts.length === 2) {
    const date = parts[0]
    const time = formatTimeForInput(parts[1])
    return `${date}T${time}`
  }
  
  return value.replace(' ', 'T')
}

// ============================================================================
// Main Component
// ============================================================================

export function FieldRenderer({ field, form, doc, meta }: FieldRendererProps) {
  const fieldName = field.fieldname
  const { getFieldStatus } = useFieldPermissions(meta, doc)
  const fieldStatus = getFieldStatus(fieldName)
  
  // Hide if no permission
  if (fieldStatus === 'None') {
    return null
  }
  
  // Skip breaks
  if (['Section Break', 'Column Break', 'HTML', 'Tab Break'].includes(field.fieldtype)) {
    return null
  }
  
  // Determine if field should be read-only
  const isReadOnly = fieldStatus === 'Read' || field.read_only
  
  // Get error state from form
  const errorState = form.formState.errors[fieldName]
  const hasError = !!errorState
  
  // Special handling for checkbox - no label wrapper
  if (field.fieldtype === 'Check') {
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field: formField }) => (
          <FormItem 
            className={cn(hasError && 'has-error')}
            data-fieldname={fieldName}
            role="group"
            aria-invalid={hasError}
            aria-describedby={hasError ? `${fieldName}-error` : undefined}
          >
            <FormControl>
              {renderFieldInput(field, formField, form, hasError, isReadOnly)}
            </FormControl>
            
            {/* Show inline error message or field description */}
            {hasError && errorState.message ? (
              <div 
                id={`${fieldName}-error`}
                className="field-error-message"
                role="alert"
              >
                {errorState.message}
              </div>
            ) : field.description ? (
              <p className="text-[11px] text-gray-500 mt-0.5">{field.description}</p>
            ) : null}
          </FormItem>
        )}
      />
    )
  }
  
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field: formField }) => (
        <FormItem 
          className={cn(hasError && 'has-error')}
          data-fieldname={fieldName}
          role="group"
          aria-invalid={hasError}
          aria-describedby={hasError ? `${fieldName}-error` : undefined}
        >
          <FormLabel className={cn(
            "text-xs font-medium",
            hasError ? "text-red-600" : "text-gray-600",
            field.reqd && "reqd"
          )}>
            {field.label}
          </FormLabel>
          <FormControl>
            {renderFieldInput(field, formField, form, hasError, isReadOnly)}
          </FormControl>
          
          {/* Show inline error message or field description */}
          {hasError && errorState.message ? (
            <div 
              id={`${fieldName}-error`}
              className="field-error-message"
              role="alert"
            >
              {errorState.message}
            </div>
          ) : field.description ? (
            <p className="text-[11px] text-gray-500 mt-0.5">{field.description}</p>
          ) : null}
        </FormItem>
      )}
    />
  )
}

// ============================================================================
// Field Input Renderer
// ============================================================================

function renderFieldInput(field: FieldMeta, formField: any, form?: any, hasError?: boolean, isReadOnly?: boolean) {
  // Common input class with error state
  const inputClass = cn(
    "h-8 text-sm",
    hasError && "border-red-500 focus:ring-red-500"
  )
  
  switch (field.fieldtype) {
    case 'Data':
    case 'Barcode':
    case 'Phone':
    case 'Password':
      return (
        <Input 
          type={field.fieldtype === 'Password' ? 'password' : 'text'} 
          className={inputClass} 
          {...formField} 
          value={formField.value || ''} 
          disabled={isReadOnly}
        />
      )
    
    case 'Int':
      return (
        <Input 
          type="number" 
          step="1" 
          className={inputClass} 
          {...formField} 
          value={formField.value ?? ''} 
          disabled={isReadOnly}
          onChange={(e) => {
            const val = e.target.value
            formField.onChange(val === '' ? null : parseInt(val, 10))
          }}
        />
      )
    
    case 'Float':
    case 'Percent':
      return (
        <Input 
          type="number" 
          step="0.01" 
          className={inputClass} 
          {...formField} 
          value={formField.value ?? ''} 
          disabled={isReadOnly}
          onChange={(e) => {
            const val = e.target.value
            formField.onChange(val === '' ? null : parseFloat(val))
          }}
        />
      )
    
    case 'Currency':
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
            $
          </span>
          <Input 
            type="number" 
            step="0.01" 
            className={cn(inputClass, "pl-8")} 
            {...formField} 
            value={formField.value ?? ''} 
            disabled={isReadOnly}
            onChange={(e) => {
              const val = e.target.value
              formField.onChange(val === '' ? null : parseFloat(val))
            }}
          />
        </div>
      )
    
    case 'Text':
    case 'Small Text':
    case 'Long Text':
      return (
        <Textarea 
          rows={field.fieldtype === 'Long Text' ? 6 : 3} 
          className={cn(
            "text-sm resize-none",
            hasError && "border-red-500 focus:ring-red-500"
          )} 
          {...formField} 
          value={formField.value || ''} 
          disabled={isReadOnly}
        />
      )
    
    case 'Date':
      return (
        <Input 
          type="date" 
          className={inputClass} 
          {...formField} 
          value={formField.value || ''} 
          disabled={isReadOnly}
        />
      )
    
    case 'Datetime':
      return (
        <Input 
          type="datetime-local" 
          className={inputClass} 
          {...formField} 
          value={formatDatetimeForInput(formField.value)} 
          disabled={isReadOnly}
          onChange={(e) => {
            // Convert back to Frappe format (space separator)
            const val = e.target.value
            formField.onChange(val ? val.replace('T', ' ') : '')
          }}
        />
      )
    
    case 'Time':
      return (
        <Input 
          type="time" 
          step="1"  // Allow seconds
          className={inputClass} 
          {...formField} 
          value={formatTimeForInput(formField.value)} 
          disabled={isReadOnly}
          onChange={(e) => {
            formField.onChange(e.target.value)
          }}
        />
      )
    
    case 'Check':
      return (
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            checked={formField.value === 1 || formField.value === true}
            disabled={isReadOnly}
            onCheckedChange={(checked) => formField.onChange(checked ? 1 : 0)}
            className={cn("h-4 w-4", hasError && "border-red-500")}
          />
          <label className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            hasError && "text-red-600",
            field.reqd && "reqd"
          )}>
            {field.label}
          </label>
        </div>
      )
    
    case 'Select':
      // Filter out empty options to avoid Select.Item error
      const options = field.options?.split('\n').filter((opt: string) => opt.trim() !== '') || []
      
      return (
        <Select value={formField.value || ''} onValueChange={formField.onChange} disabled={isReadOnly}>
          <SelectTrigger className={cn(inputClass, hasError && "border-red-500")}>
            <SelectValue placeholder={`Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt: string) => (
              <SelectItem key={opt} value={opt} className="text-sm">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    
    case 'Link':
      return (
        <LinkField
          value={formField.value || ''}
          onChange={formField.onChange}
          doctype={field.options || ''}
          placeholder={`Select ${field.options}`}
          disabled={isReadOnly || field.read_only === 1}
          hasError={hasError}
        />
      )
    
    case 'Table':
      return (
        <ChildTable
          value={formField.value || []}
          onChange={formField.onChange}
          doctype={field.options || ''}
          disabled={isReadOnly || field.read_only === 1}
          parentForm={form}
        />
      )
    
    case 'Attach':
    case 'Attach Image':
      return (
        <div className={cn(
          "border-2 border-dashed rounded p-4 text-center",
          hasError && "border-red-500"
        )}>
          <Input type="file" className="hidden" id={field.fieldname} />
          <label htmlFor={field.fieldname} className="cursor-pointer">
            <p className="text-sm text-muted-foreground">Click to upload file</p>
          </label>
        </div>
      )
    
    case 'Text Editor':
    case 'Code':
    case 'HTML':
      return (
        <Textarea 
          rows={8} 
          {...formField} 
          value={formField.value || ''} 
          className={cn(
            "font-mono text-sm resize-none",
            hasError && "border-red-500 focus:ring-red-500"
          )} 
        />
      )
    
    case 'Read Only':
      return (
        <Input 
          {...formField} 
          value={formField.value || ''} 
          disabled 
          className="bg-gray-50 h-8 text-sm" 
        />
      )
    
    default:
      return (
        <Input 
          {...formField} 
          value={formField.value || ''} 
          placeholder={field.fieldtype} 
          className={inputClass} 
        />
      )
  }
}

// ============================================================================
// Scroll to Field Utility
// ============================================================================

/**
 * Scroll to a field by its fieldname
 * Uses the data-fieldname attribute set on FormItem
 */
export function scrollToField(fieldname: string): boolean {
  const element = document.querySelector(`[data-fieldname="${fieldname}"]`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    
    // Focus the input if possible
    const input = element.querySelector('input, textarea, select') as HTMLElement
    if (input) {
      setTimeout(() => input.focus(), 300)
    }
    
    return true
  }
  return false
}

/**
 * Scroll to the first field with an error
 */
export function scrollToFirstError(form: any): boolean {
  const errors = form.formState.errors
  const firstErrorField = Object.keys(errors)[0]
  
  if (firstErrorField) {
    return scrollToField(firstErrorField)
  }
  
  return false
}
