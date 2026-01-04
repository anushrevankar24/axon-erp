"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

type BlockModuleRow = { module: string }

export interface ModuleEditorProps {
  allModules: string[]
  value: BlockModuleRow[]
  onChange: (next: BlockModuleRow[]) => void
  disabled?: boolean
}

// Desk parity:
// - Field is block_modules (stores blocked modules)
// - UI is "Allow Modules" where checkbox checked = allowed (not blocked)
export function ModuleEditor({
  allModules,
  value,
  onChange,
  disabled = false,
}: ModuleEditorProps) {
  const blocked = React.useMemo(() => new Set((value || []).map((r) => r.module)), [value])

  const toggleModule = React.useCallback(
    (module: string, allowed: boolean) => {
      if (allowed) {
        // remove from block_modules
        onChange((value || []).filter((r) => r.module !== module))
      } else {
        // add to block_modules
        if (blocked.has(module)) return
        onChange([...(value || []), { doctype: "Block Module", module } as any])
      }
    },
    [blocked, onChange, value]
  )

  const selectAll = React.useCallback(() => {
    // Allow all modules => block list empty
    onChange([])
  }, [onChange])

  const unselectAll = React.useCallback(() => {
    // Unselect all (allow none) => block everything
    onChange((allModules || []).map((module) => ({ doctype: "Block Module", module } as any)))
  }, [allModules, onChange])

  if (!allModules || allModules.length === 0) {
    return <div className="text-sm text-muted-foreground p-3">No modules available</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={selectAll} disabled={disabled}>
          Select All
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={unselectAll} disabled={disabled}>
          Unselect All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-3">
        {allModules.map((module) => {
          const allowed = !blocked.has(module)
          return (
            <div key={module} className="flex items-center gap-2">
              <Checkbox
                checked={allowed}
                disabled={disabled}
                onCheckedChange={(next) => toggleModule(module, Boolean(next))}
              />
              <span className="text-sm">{module}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}


