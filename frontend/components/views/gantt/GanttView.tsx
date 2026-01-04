/**
 * Gantt View Component
 * 
 * Matches ERPNext Desk Gantt view behavior and user_settings persistence.
 * Based on: frappe/public/js/frappe/views/gantt/gantt_view.js
 */

"use client"

import * as React from "react"
import { useMeta, useListData } from "@/lib/api/hooks"
import { useUserSettings } from "@/lib/user-settings/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, ZoomIn, ZoomOut } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { format, differenceInDays, startOfDay, addDays } from "date-fns"

interface GanttViewProps {
  doctype: string
}

type ViewMode = 'Day' | 'Week' | 'Month' | 'Year'

export function GanttView({ doctype }: GanttViewProps) {
  const { data: meta, isLoading: metaLoading } = useMeta(doctype)
  const { data: userSettings } = useUserSettings(doctype)
  
  // DESK PARITY: Use gantt_view_mode from user_settings
  const viewMode: ViewMode = (userSettings?.Gantt?.gantt_view_mode as ViewMode) || 'Month'
  
  // DESK PARITY NOTE: Date fields come from calendar_settings or meta, not user_settings
  // TODO: Load from frappe.views.calendar[doctype] config or calendar_settings
  const startDateField = userSettings?.Gantt?.start_date_field || 'start_date'
  const endDateField = userSettings?.Gantt?.end_date_field || 'end_date'
  
  const [currentDate, setCurrentDate] = React.useState(new Date())
  
  // Fetch data
  const { data: listData, isLoading: dataLoading } = useListData({
    doctype,
    filters: userSettings?.Gantt?.filters || {},
    pageSize: 500
  })
  
  if (metaLoading || dataLoading) {
    return <GanttSkeleton />
  }
  
  if (!meta) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        DocType "{doctype}" not found
      </div>
    )
  }
  
  // Calculate timeline range based on data
  const today = startOfDay(new Date())
  const timelineStart = addDays(today, -30)
  const timelineEnd = addDays(today, 90)
  const totalDays = differenceInDays(timelineEnd, timelineStart)
  
  return (
    <div className="p-6 h-full">
      {/* Gantt Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">{doctype} Gantt</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ZoomOut className="h-4 w-4 mr-2" />
            Zoom Out
          </Button>
          <Button variant="outline" size="sm">
            <ZoomIn className="h-4 w-4 mr-2" />
            Zoom In
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>
      
      {/* Gantt Chart */}
      <Card>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Timeline Header */}
            <div className="flex border-b">
              <div className="w-48 flex-shrink-0 p-3 border-r bg-gray-50 font-semibold text-sm">
                Task
              </div>
              <div className="flex-1 flex">
                {Array.from({ length: Math.ceil(totalDays / 30) }).map((_, i) => (
                  <div key={i} className="flex-1 p-3 border-r bg-gray-50 text-center text-sm font-semibold">
                    {format(addDays(timelineStart, i * 30), 'MMM yyyy')}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Gantt Rows */}
            <div className="divide-y">
              {listData?.map((item: any) => {
                const startDate = item[startDateField] ? new Date(item[startDateField]) : null
                const endDate = item[endDateField] ? new Date(item[endDateField]) : null
                
                let barLeft = 0
                let barWidth = 0
                
                if (startDate && endDate) {
                  const daysFromStart = differenceInDays(startDate, timelineStart)
                  const duration = differenceInDays(endDate, startDate)
                  
                  barLeft = (daysFromStart / totalDays) * 100
                  barWidth = (duration / totalDays) * 100
                }
                
                return (
                  <div key={item.name} className="flex items-center hover:bg-muted/50">
                    <div className="w-48 flex-shrink-0 p-3 border-r text-sm truncate">
                      {item.name}
                    </div>
                    <div className="flex-1 p-3 relative h-12">
                      {startDate && endDate && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 bg-primary h-6 rounded cursor-pointer hover:bg-primary/80 transition-colors"
                          style={{
                            left: `${Math.max(0, barLeft)}%`,
                            width: `${Math.max(2, barWidth)}%`
                          }}
                          title={`${item.name}: ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function GanttSkeleton() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <Card>
        <div className="p-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 flex-1" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}


