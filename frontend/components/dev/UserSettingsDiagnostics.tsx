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
  const [diagnostics, setDiagnostics] = React.useState<{
    pendingCount: number
    pendingWrites: Array<{ doctype: string }>
    cachedSettings: Record<string, any>
  }>({
    pendingCount: 0,
    pendingWrites: [],
    cachedSettings: {}
  })
  
  const refreshDiagnostics = () => {
    setDiagnostics({
      pendingCount: userSettingsService.getPendingCount(),
      pendingWrites: userSettingsService.getPendingWrites(),
      cachedSettings: userSettingsService.getAllCached()
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
            {/* Cached Settings */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Cached Settings</span>
                <Badge variant="secondary">
                  {Object.keys(diagnostics.cachedSettings).length} doctypes
                </Badge>
              </div>
              {Object.keys(diagnostics.cachedSettings).length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-auto">
                  {Object.entries(diagnostics.cachedSettings).map(([doctype, settings]) => (
                    <details key={doctype} className="bg-muted/50 rounded p-2">
                      <summary className="font-medium cursor-pointer">{doctype}</summary>
                      <pre className="text-[10px] mt-2 overflow-auto">
                        {JSON.stringify(settings, null, 2)}
                      </pre>
                    </details>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">No cached settings</div>
              )}
            </div>
            
            {/* Pending Writes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Pending Writes (Debounced)</span>
                <Badge variant={diagnostics.pendingCount > 0 ? "default" : "secondary"}>
                  {diagnostics.pendingCount}
                </Badge>
              </div>
              {diagnostics.pendingCount > 0 ? (
                <div className="space-y-2">
                  {diagnostics.pendingWrites.map((write: any, idx) => (
                    <div key={idx} className="bg-yellow-50 rounded p-2">
                      <div className="font-medium">{write.doctype}</div>
                      <div className="text-[10px] mt-1 text-muted-foreground">
                        Will POST in ~500ms
                      </div>
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
            
            {/* localStorage Keys */}
            <div>
              <div className="font-semibold mb-2">localStorage Keys (Desk)</div>
              <div className="bg-muted/50 rounded p-2 text-[10px] space-y-1">
                <div>• Form sections: [css_class]-closed</div>
                <div>• Calendar view: cal_defaultView</div>
                <div>• Calendar weekends: cal_weekends</div>
                <div className="pt-1 text-muted-foreground">
                  Current count: {typeof window !== 'undefined' ? Object.keys(localStorage).filter(k => k.endsWith('-closed') || k.startsWith('cal_')).length : 0}
                </div>
              </div>
            </div>
            
            {/* Current Settings Info */}
            <div className="text-[10px] text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground mb-1">Implementation Status</div>
              <div>✅ Service: Desk-parity engine</div>
              <div>✅ List: sort_by/sort_order (Desk keys)</div>
              <div>✅ Form: localStorage + in-memory</div>
              <div>✅ GridView: Desk-compatible</div>
              <div>⚠️ Kanban: needs Board doctype</div>
              <div>⚠️ Calendar: needs View doctype</div>
              <div className="pt-2 border-t mt-2">
                <div className="font-semibold text-foreground mb-1">API Details</div>
                <div>• Debounce: 500ms POST delay</div>
                <div>• Cache: In-memory per doctype</div>
                <div>• Merge: Deep (jQuery pattern)</div>
                <div>• Compare: JSON (no-op skip)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

