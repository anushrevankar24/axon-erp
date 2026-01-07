"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function JumpToFieldDialog(props: {
  open: boolean
  fields: Array<{ fieldname: string; label?: string }>
  onCancel: () => void
  onSelect: (fieldname: string) => void
}) {
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    if (props.open) setQuery("")
  }, [props.open])

  const normalized = query.trim().toLowerCase()
  const filtered = normalized
    ? props.fields.filter((f) => (f.label || f.fieldname).toLowerCase().includes(normalized))
    : props.fields

  return (
    <Dialog open={props.open} onOpenChange={(o) => !o && props.onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Jump to field</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Select Field *</label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search fields..." />
          </div>

          <div className="max-h-80 overflow-auto border rounded-md">
            {filtered.map((f) => (
              <button
                key={f.fieldname}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                onClick={() => props.onSelect(f.fieldname)}
              >
                {f.label || f.fieldname}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-muted-foreground">No fields found</div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={props.onCancel}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



