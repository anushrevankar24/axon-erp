"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FieldRenderer } from "./FieldRenderer"
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface QuickEntryInlineProps {
  fields: any[]
  form: any
  doc: any
  meta: any
  dependencyState?: any
  userSettings?: any
  docinfo?: any
  onEditFullForm: () => void
}

/**
 * Inline Quick Entry Component
 * 
 * Matches ERPNext quick_entry.js behavior but renders inline (not in a modal)
 * Shows only required/quick-entry fields with an "Edit Full Form" button
 */
export function QuickEntryInline({
  fields,
  form,
  doc,
  meta,
  dependencyState,
  userSettings,
  docinfo,
  onEditFullForm
}: QuickEntryInlineProps) {
  return (
    <div className="space-y-4">
      {/* Quick Entry Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Quick Entry</h2>
          <p className="text-sm text-muted-foreground">
            Fill in the essential fields to get started quickly
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onEditFullForm}
          className="text-sm"
        >
          Edit Full Form
        </Button>
      </div>

      {/* Quick Entry Fields */}
      <Card className="p-6">
        <div className="grid md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.fieldname} className={cn(
                // Full width for certain field types
                ['Text', 'Small Text', 'Text Editor', 'Long Text'].includes(field.fieldtype) && "md:col-span-2"
              )}>
                <FieldRenderer
                  field={field}
                  form={form}
                  doc={doc}
                  meta={meta}
                  dependencyState={dependencyState}
                  userSettings={userSettings}
                  docinfo={docinfo}
                />
              </div>
            ))}
        </div>
      </Card>
    </div>
  )
}

