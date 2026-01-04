/**
 * Calendar View Component
 * 
 * Matches ERPNext Desk Calendar view behavior and user_settings persistence.
 * Based on: frappe/public/js/frappe/views/calendar/calendar.js
 */

"use client"

import * as React from "react"
import { useMeta, useListData } from "@/lib/api/hooks"
import { useUserSettings } from "@/lib/user-settings/react"
import { saveUserSettings } from "@/lib/user-settings/service"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Settings } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns"

interface CalendarViewProps {
  doctype: string
}

export function CalendarView({ doctype }: CalendarViewProps) {
  const { data: meta, isLoading: metaLoading } = useMeta(doctype)
  const { data: userSettings } = useUserSettings(doctype)
  
  // Calendar state
  const [currentDate, setCurrentDate] = React.useState(new Date())
  
  // Get date fields from user settings or defaults
  const startDateField = userSettings?.Calendar?.start_date_field || 'start_date'
  const endDateField = userSettings?.Calendar?.end_date_field || 'end_date'
  
  // Fetch data for current month
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  
  const { data: listData, isLoading: dataLoading } = useListData({
    doctype,
    filters: {
      ...userSettings?.Calendar?.filters,
      [startDateField]: ['between', [
        format(monthStart, 'yyyy-MM-dd'),
        format(monthEnd, 'yyyy-MM-dd')
      ]]
    },
    pageSize: 500
  })
  
  if (metaLoading || dataLoading) {
    return <CalendarSkeleton />
  }
  
  if (!meta) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        DocType "{doctype}" not found
      </div>
    )
  }
  
  // Get all days in month
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Group events by date
  const eventsByDate: Record<string, any[]> = {}
  listData?.forEach((doc: any) => {
    const startDate = doc[startDateField]
    if (startDate) {
      const dateKey = format(new Date(startDate), 'yyyy-MM-dd')
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = []
      }
      eventsByDate[dateKey].push(doc)
    }
  })
  
  return (
    <div className="p-6 h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
        
        {/* Days */}
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const events = eventsByDate[dateKey] || []
          const isToday = isSameDay(day, new Date())
          
          return (
            <Card 
              key={dateKey}
              className={`min-h-[120px] ${isToday ? 'border-primary' : ''}`}
            >
              <CardContent className="p-2">
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {events.slice(0, 3).map((event, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-primary/10 rounded px-2 py-1 truncate cursor-pointer hover:bg-primary/20"
                    >
                      {event.name}
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{events.length - 3} more
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function CalendarSkeleton() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px]" />
        ))}
      </div>
    </div>
  )
}

