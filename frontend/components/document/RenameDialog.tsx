"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

export interface RenameDialogValue {
  newName: string
  merge: boolean
}

export function RenameDialog(props: {
  open: boolean
  currentName: string
  onCancel: () => void
  onConfirm: (value: RenameDialogValue) => void
}) {
  const [newName, setNewName] = React.useState(props.currentName)
  const [merge, setMerge] = React.useState(false)

  React.useEffect(() => {
    if (props.open) {
      setNewName(props.currentName || "")
      setMerge(false)
    }
  }, [props.open, props.currentName])

  const canConfirm = !!newName && newName.trim().length > 0 && newName !== props.currentName

  return (
    <Dialog open={props.open} onOpenChange={(o) => !o && props.onCancel()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Rename {props.currentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">New Name *</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={merge} onCheckedChange={(v) => setMerge(!!v)} />
            <div className="text-sm">
              Merge with existing <span className="font-semibold">(This cannot be undone)</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={props.onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => props.onConfirm({ newName: newName.trim(), merge })}
            disabled={!canConfirm}
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



