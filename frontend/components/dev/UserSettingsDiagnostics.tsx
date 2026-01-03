/**
 * User Settings Diagnostics Panel
 * 
 * Dev-only panel to inspect user_settings state and pending writes.
 * Only rendered in development mode.
 */

"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { userSettingsService } from "@/lib/user-settings/service"
import { RefreshCw, X } from "lucide-react"
import { runAllParityTests } from "@/lib/user-settings/__tests__/roundtrip.test"

export function UserSettingsDiagnostics() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [diagnostics, setDiagnostics] = React.useState({
    pendingCount: 0,
    pendingWrites: []
  })
  
  const refreshDiagnostics = () => {
    setDiagnostics({
      pendingCount: userSettingsService.getPendingCount(),
      pendingWrites: userSettingsService.getPendingWrites()
    })
  }
  
  React.useEffect(() => {
    if (isOpen) {
      refreshDiagnostics()
      const interval = setInterval(refreshDiagnostics, 1000)
      return () => clearInterval(interval)
    }
  }, [isOpen])
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <>
      {/* Toggle Button (bottom-right corner) */}
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-4 w-4" /> : '🔍 Settings'}
      </Button>
      
      {/* Diagnostics Panel */}
      {isOpen && (
        <Card className="fixed bottom-16 right-4 w-96 max-h-[600px] overflow-auto z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">User Settings Diagnostics</CardTitle>
              <Button variant="ghost" size="sm" className="h-7" onClick={refreshDiagnostics}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* Pending Writes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Pending Writes</span>
                <Badge variant={diagnostics.pendingCount > 0 ? "default" : "secondary"}>
                  {diagnostics.pendingCount}
                </Badge>
              </div>
              {diagnostics.pendingCount > 0 ? (
                <div className="space-y-2">
                  {diagnostics.pendingWrites.map((write: any, idx) => (
                    <div key={idx} className="bg-muted/50 rounded p-2">
                      <div className="font-medium">{write.doctype}</div>
                      <pre className="text-[10px] mt-1 overflow-auto">
                        {JSON.stringify(write.updates, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">No pending writes</div>
              )}
            </div>
            
            {/* Manual Flush */}
            <div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  userSettingsService.flush().then(() => {
                    refreshDiagnostics()
                    console.log('[Diagnostics] Flushed all pending writes')
                  })
                }}
                disabled={diagnostics.pendingCount === 0}
              >
                Flush All Writes Now
              </Button>
            </div>
            
            {/* Parity Tests */}
            <div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  console.clear()
                  runAllParityTests()
                }}
              >
                Run Parity Tests (Check Console)
              </Button>
            </div>
            
            {/* Current Settings Info */}
            <div className="text-[10px] text-muted-foreground">
              <div>Service: userSettingsService</div>
              <div>Debounce: 1000ms</div>
              <div>API: frappe.model.utils.user_settings.*</div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

