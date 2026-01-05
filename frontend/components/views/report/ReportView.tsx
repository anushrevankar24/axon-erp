/**
 * Report View Component
 * 
 * Matches ERPNext Desk Query Report view behavior and user_settings persistence.
 * Based on: frappe/public/js/frappe/views/reports/* and query_report.js
 */

"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { call } from "@/lib/api/client"
import { useUserSettings } from "@/lib/user-settings/react"
import { saveUserSettings } from "@/lib/user-settings/service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings, Download, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { exportQueryReport } from "@/lib/api/reports"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ReportViewProps {
  reportName: string
}

export function ReportView({ reportName }: ReportViewProps) {
  const { data: userSettings } = useUserSettings(reportName)
  const [showExportDialog, setShowExportDialog] = useState(false)
  
  // Report state
  const [filters, setFilters] = React.useState<Record<string, any>>(
    userSettings?.Report?.filters || {}
  )
  
  // Fetch report data
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['report', reportName, filters],
    queryFn: async () => {
      const result = await call('frappe.desk.query_report.run', {
        report_name: reportName,
        filters: JSON.stringify(filters)
      })
      return result.message || {}
    }
  })
  
  // Track if settings have been applied (Desk parity: apply once on init)
  const didInitRef = React.useRef(false)
  
  // Apply user_settings once when they load (Desk parity)
  React.useEffect(() => {
    if (userSettings?.Report && !didInitRef.current) {
      didInitRef.current = true
      
      // Apply saved filters if any
      if (userSettings.Report.filters) {
        setFilters(userSettings.Report.filters)
      }
    }
  }, [userSettings])
  
  // Persist filter changes (Desk-style: only save when user changes, not on init)
  React.useEffect(() => {
    if (!didInitRef.current) return // Don't save during init
    
    if (Object.keys(filters).length > 0) {
      saveUserSettings(reportName, 'Report', { filters }).catch(err => {
        console.error('[ReportView] Failed to save filters:', err)
      })
    }
  }, [filters, reportName])
  
  if (isLoading) {
    return <ReportSkeleton />
  }
  
  const columns = reportData?.columns || []
  const data = reportData?.result || []
  
  const handleExport = (fileFormat: 'CSV' | 'Excel') => {
    exportQueryReport({
      report_name: reportName,
      filters,
      file_format_type: fileFormat,
      export_in_background: data.length > 500,
    })
    setShowExportDialog(false)
  }
  
  return (
    <div className="p-6 h-full">
      {/* Report Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">{reportName}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>
      
      {/* Report Filters (if any) */}
      {reportData?.filters && reportData.filters.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {reportData.filters.map((filter: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <label className="text-xs font-medium">{filter.label}</label>
                  <div className="text-sm text-muted-foreground">
                    {filters[filter.fieldname] || '-'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Report Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col: any, idx: number) => (
                  <TableHead key={idx} className="font-semibold">
                    {col.label || col.fieldname}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((row: any, rowIdx: number) => (
                  <TableRow key={rowIdx}>
                    {columns.map((col: any, colIdx: number) => {
                      const value = Array.isArray(row) ? row[colIdx] : row[col.fieldname]
                      return (
                        <TableCell key={colIdx} className="text-sm">
                          {formatReportValue(value, col.fieldtype)}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                    No data
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      {/* Export Dialog (Desk pattern) */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export {reportName}</DialogTitle>
            <DialogDescription>
              Choose export format
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleExport('CSV')}
                className="flex-1"
              >
                Export as CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExport('Excel')}
                className="flex-1"
              >
                Export as Excel
              </Button>
            </div>
            
            {data.length > 500 && (
              <p className="text-sm text-muted-foreground">
                Large exports will be processed in the background and emailed to you
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatReportValue(value: any, fieldtype?: string): string {
  if (value === null || value === undefined) return '-'
  
  switch (fieldtype) {
    case 'Currency':
    case 'Float':
      return typeof value === 'number' ? value.toFixed(2) : String(value)
    case 'Date':
      return value ? new Date(value).toLocaleDateString() : '-'
    case 'Datetime':
      return value ? new Date(value).toLocaleString() : '-'
    default:
      return String(value)
  }
}

function ReportSkeleton() {
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
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </Card>
    </div>
  )
}


