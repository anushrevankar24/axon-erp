/**
 * Kanban View Component
 * 
 * Matches ERPNext Desk Kanban view behavior and user_settings persistence.
 * Based on: frappe/public/js/frappe/views/kanban/kanban_view.js
 */

"use client"

import * as React from "react"
import { useMeta, useListData } from "@/lib/api/hooks"
import { useUserSettings } from "@/lib/user-settings/react"
import { saveUserSettings } from "@/lib/user-settings/service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Settings } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface KanbanViewProps {
  doctype: string
}

export function KanbanView({ doctype }: KanbanViewProps) {
  const { data: meta, isLoading: metaLoading } = useMeta(doctype)
  const { data: userSettings } = useUserSettings(doctype)
  
  // Get kanban field from user settings or default to "status"
  const kanbanField = userSettings?.Kanban?.kanban_column_field || 'status'
  const kanbanDisplayFields = userSettings?.Kanban?.kanban_fields || []
  
  // Fetch data
  const { data: listData, isLoading: dataLoading } = useListData({
    doctype,
    filters: userSettings?.Kanban?.filters || {},
    pageSize: 500  // Kanban typically loads more items
  })
  
  if (metaLoading || dataLoading) {
    return <KanbanSkeleton />
  }
  
  if (!meta) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        DocType "{doctype}" not found
      </div>
    )
  }
  
  // Get unique values for kanban columns
  const fieldMeta = meta.fields?.find((f: any) => f.fieldname === kanbanField)
  let columnValues: string[] = []
  
  if (fieldMeta?.fieldtype === 'Select' && fieldMeta.options) {
    // Use Select options as columns
    columnValues = fieldMeta.options.split('\n').filter((v: string) => v.trim())
  } else {
    // Extract unique values from data
    const uniqueValues = new Set<string>()
    listData?.forEach((doc: any) => {
      const value = doc[kanbanField]
      if (value) uniqueValues.add(String(value))
    })
    columnValues = Array.from(uniqueValues)
  }
  
  // Group data by kanban field
  const groupedData: Record<string, any[]> = {}
  columnValues.forEach(value => {
    groupedData[value] = listData?.filter((doc: any) => doc[kanbanField] === value) || []
  })
  
  return (
    <div className="p-6 h-full">
      {/* Kanban Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">{doctype} Kanban</h2>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </div>
      
      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columnValues.map(columnValue => (
          <KanbanColumn
            key={columnValue}
            title={columnValue}
            items={groupedData[columnValue] || []}
            displayFields={kanbanDisplayFields}
            doctype={doctype}
          />
        ))}
      </div>
    </div>
  )
}

function KanbanColumn({ 
  title, 
  items, 
  displayFields,
  doctype 
}: { 
  title: string
  items: any[]
  displayFields: string[]
  doctype: string
}) {
  return (
    <div className="flex-shrink-0 w-80">
      {/* Column Header */}
      <div className="bg-gray-100 rounded-t-lg px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {items.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Cards */}
      <div className="bg-gray-50 rounded-b-lg p-3 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
        {items.map((item) => (
          <KanbanCard
            key={item.name}
            item={item}
            displayFields={displayFields}
            doctype={doctype}
          />
        ))}
      </div>
    </div>
  )
}

function KanbanCard({ 
  item, 
  displayFields,
  doctype 
}: { 
  item: any
  displayFields: string[]
  doctype: string
}) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3 space-y-2">
        <div className="font-medium text-sm">{item.name}</div>
        {displayFields.map(field => (
          item[field] && (
            <div key={field} className="text-xs text-muted-foreground">
              {String(item[field])}
            </div>
          )
        ))}
      </CardContent>
    </Card>
  )
}

function KanbanSkeleton() {
  return (
    <div className="p-6">
      <div className="flex gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-shrink-0 w-80">
            <Skeleton className="h-12 w-full mb-2" />
            <div className="space-y-2">
              {[1, 2, 3].map(j => (
                <Skeleton key={j} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

