"use client"

import * as React from "react"
import { Plus, Trash2, GripVertical } from "lucide-react"
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

interface ChildTableProps {
  value: any[]
  onChange: (value: any[]) => void
  doctype: string
  disabled?: boolean
  parentForm?: any
}

export function ChildTable({
  value = [],
  onChange,
  doctype,
  disabled = false,
  parentForm
}: ChildTableProps) {
  const { data: childMeta, isLoading } = useMeta(doctype)

  if (isLoading) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading {doctype}...</p>
      </div>
    )
  }

  if (!childMeta) {
    return (
      <div className="border rounded-lg p-4 text-sm text-destructive">
        Error: Could not load {doctype} metadata
      </div>
    )
  }

  // Get visible fields (exclude hidden, system fields)
  const visibleFields = childMeta.fields?.filter(
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
      !['Section Break', 'Column Break', 'HTML'].includes(f.fieldtype)
  ) || []

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
              value.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="group hover:bg-muted/50">
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
              ))
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

