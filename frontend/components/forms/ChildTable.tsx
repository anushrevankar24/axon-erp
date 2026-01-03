"use client"

import * as React from "react"
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useMeta } from "@/lib/api/hooks"
import { ChildTableCell } from "./ChildTableCell"
import { TableSkeleton } from "@/components/ui/skeleton"

interface ChildTableProps {
  value: any[]
  onChange: (value: any[]) => void
  doctype: string
  disabled?: boolean
  parentForm?: any
  userSettings?: any  // GridView user settings for this child table
}

export function ChildTable({
  value = [],
  onChange,
  doctype,
  disabled = false,
  parentForm,
  userSettings
}: ChildTableProps) {
  const { data: childMeta, isLoading } = useMeta(doctype)
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set())

  if (isLoading) {
    return <TableSkeleton rows={3} columns={4} />
  }

  if (!childMeta) {
    return (
      <div className="border rounded-lg p-4 text-sm text-destructive">
        Error: Could not load {doctype} metadata
      </div>
    )
  }

  // Get all editable fields (exclude hidden, system fields, layout fields)
  const allEditableFields = childMeta.fields?.filter(
    (f: any) => 
      !f.hidden && 
      f.fieldname !== 'name' && 
      f.fieldname !== 'owner' &&
      f.fieldname !== 'modified' &&
      f.fieldname !== 'modified_by' &&
      f.fieldname !== 'creation' &&
      f.fieldname !== 'docstatus' &&
      f.fieldname !== 'parent' &&
      f.fieldname !== 'parentfield' &&
      f.fieldname !== 'parenttype' &&
      !['Section Break', 'Column Break', 'HTML', 'Tab Break'].includes(f.fieldtype)
  ) || []

  // ERPNext Grid parity: select columns based on user_settings or in_list_view flag
  // Matches grid.js setup_visible_columns() and setup_user_defined_columns()
  let gridFields: any[] = []
  let gridFieldsRaw: any[] = []  // Declare at outer scope for dev logging
  
  // Check for user-defined columns first (GridView user settings)
  if (userSettings && Array.isArray(userSettings) && userSettings.length > 0) {
    // User has customized columns for this grid
    gridFields = userSettings
      .map((setting: any) => {
        const field = allEditableFields.find((f: any) => f.fieldname === setting.fieldname)
        if (field) {
          return {
            ...field,
            in_list_view: 1,  // Mark as visible
            colsize: setting.columns || field.colsize
          }
        }
        return null
      })
      .filter(Boolean)
    gridFieldsRaw = gridFields  // For logging
  } else {
    // Use in_list_view from meta
    gridFieldsRaw = allEditableFields.filter((f: any) => f.in_list_view === 1)
    // Fallback if no fields marked in_list_view: show first few fields
    gridFields = gridFieldsRaw.length > 0 ? gridFieldsRaw : allEditableFields.slice(0, 6)
  }
  
  // Apply colsize cap (ERPNext Grid stops at total colsize ≈ 11)
  // Assign default colsize based on fieldtype (matches grid.js update_default_colsize)
  const fieldsWithColsize = gridFields.map((f: any) => {
    let colsize = 2 // default
    if (f.fieldtype === 'Check') colsize = 1
    else if (f.fieldtype === 'Small Text') colsize = 3
    else if (f.fieldtype === 'Text') colsize = 2
    return { ...f, colsize: f.colsize || colsize }
  })
  
  // Cap total colsize at 11 (ERPNext Grid threshold)
  let totalColsize = 0
  const cappedGridFields: any[] = []
  for (const field of fieldsWithColsize) {
    if (totalColsize + field.colsize > 11) break
    cappedGridFields.push(field)
    totalColsize += field.colsize
  }
  
  // Use capped fields, or fallback to at least 3 fields
  const visibleFields = cappedGridFields.length >= 3 ? cappedGridFields : fieldsWithColsize.slice(0, 3)
  
  // Non-grid fields (for inline row editor)
  const nonGridFields = allEditableFields.filter(
    (f: any) => !visibleFields.find((vf: any) => vf.fieldname === f.fieldname)
  )
  
  // Dev logging (optional, as per plan)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ChildTable ${doctype}]`, {
      totalFields: allEditableFields.length,
      in_list_view: gridFieldsRaw.length,
      visibleColumns: visibleFields.length,
      nonGridFields: nonGridFields.length
    })
  }
  
  const toggleRowExpansion = (rowIndex: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(rowIndex)) {
        next.delete(rowIndex)
      } else {
        next.add(rowIndex)
      }
      return next
    })
  }

  const addRow = () => {
    const newRow: any = { 
      idx: value.length + 1,
      doctype: doctype
    }
    
    // Initialize fields with defaults
    visibleFields.forEach((field: any) => {
      if (field.default) {
        newRow[field.fieldname] = field.default
      } else if (field.fieldtype === 'Check') {
        newRow[field.fieldname] = 0
      } else if (['Int', 'Float', 'Currency', 'Percent'].includes(field.fieldtype)) {
        newRow[field.fieldname] = 0
      } else {
        newRow[field.fieldname] = ''
      }
    })
    
    onChange([...value, newRow])
  }

  const deleteRow = (index: number) => {
    const newValue = value.filter((_, i) => i !== index)
    // Reindex rows
    newValue.forEach((row, i) => {
      row.idx = i + 1
    })
    onChange(newValue)
  }

  const updateCell = (rowIndex: number, fieldname: string, cellValue: any) => {
    const newValue = [...value]
    if (!newValue[rowIndex]) {
      newValue[rowIndex] = { idx: rowIndex + 1, doctype: doctype }
    }
    newValue[rowIndex] = { 
      ...newValue[rowIndex], 
      [fieldname]: cellValue 
    }
    onChange(newValue)
  }

  const duplicateRow = (index: number) => {
    const rowToDuplicate = { ...value[index] }
    delete rowToDuplicate.name // Remove name to create new row
    rowToDuplicate.idx = value.length + 1
    onChange([...value, rowToDuplicate])
  }

  return (
    <div className="border rounded-lg bg-white">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center">#</TableHead>
              {visibleFields.map((field: any) => (
                <TableHead key={field.fieldname} className="min-w-[150px]">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{field.label}</span>
                    {field.reqd === 1 && (
                      <span className="text-red-500" title="Required">*</span>
                    )}
                  </div>
                  {field.description && (
                    <p className="text-xs font-normal text-muted-foreground mt-0.5">
                      {field.description}
                    </p>
                  )}
                </TableHead>
              ))}
              {!disabled && <TableHead className="w-24 text-center">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {value.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={visibleFields.length + 2} 
                  className="text-center text-muted-foreground py-12"
                >
                  <div className="flex flex-col items-center gap-2">
                    <p>No rows added yet</p>
                    {!disabled && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addRow}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Row
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              value.map((row, rowIndex) => {
                const isExpanded = expandedRows.has(rowIndex)
                return (
                  <React.Fragment key={rowIndex}>
                    <TableRow className="group hover:bg-muted/50">
                      <TableCell className="text-center text-sm text-muted-foreground font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                          {rowIndex + 1}
                        </div>
                      </TableCell>
                      {visibleFields.map((field: any) => (
                        <TableCell key={field.fieldname} className="p-2">
                          <ChildTableCell
                            field={field}
                            value={row[field.fieldname]}
                            onChange={(newValue) => updateCell(rowIndex, field.fieldname, newValue)}
                            disabled={disabled || field.read_only === 1}
                            rowData={row}
                            parentForm={parentForm}
                          />
                        </TableCell>
                      ))}
                      {!disabled && (
                        <TableCell className="p-2">
                          <div className="flex items-center justify-center gap-1">
                            {nonGridFields.length > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleRowExpansion(rowIndex)}
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                title={isExpanded ? "Collapse row" : "Edit all fields"}
                              >
                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => duplicateRow(rowIndex)}
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Duplicate row"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRow(rowIndex)}
                              className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete row"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                    {isExpanded && nonGridFields.length > 0 && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={visibleFields.length + 2} className="p-4">
                          <div className="grid md:grid-cols-2 gap-3">
                            {nonGridFields.map((field: any) => (
                              <div key={field.fieldname} className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-700">
                                  {field.label}
                                  {field.reqd === 1 && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <ChildTableCell
                                  field={field}
                                  value={row[field.fieldname]}
                                  onChange={(newValue) => updateCell(rowIndex, field.fieldname, newValue)}
                                  disabled={disabled || field.read_only === 1}
                                  rowData={row}
                                  parentForm={parentForm}
                                />
                                {field.description && (
                                  <p className="text-xs text-muted-foreground">{field.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {!disabled && value.length > 0 && (
        <div className="p-3 border-t bg-muted/20">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
          <span className="ml-4 text-sm text-muted-foreground">
            {value.length} {value.length === 1 ? 'row' : 'rows'}
          </span>
        </div>
      )}
    </div>
  )
}

