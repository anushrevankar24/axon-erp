"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export interface LinkedWithItem {
  doctype: string
  fieldnames: string[]
}

export function LinksDialog(props: {
  open: boolean
  items: LinkedWithItem[]
  onClose: () => void
  onOpenDoctype: (item: LinkedWithItem) => void
}) {
  return (
    <Dialog open={props.open} onOpenChange={(o) => !o && props.onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Links</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {props.items.map((item) => (
            <button
              key={item.doctype}
              type="button"
              className="w-full text-left px-3 py-2 rounded-md border hover:bg-muted"
              onClick={() => props.onOpenDoctype(item)}
            >
              <div className="text-sm font-medium">{item.doctype}</div>
              {item.fieldnames?.length ? (
                <div className="text-xs text-muted-foreground">
                  Linked via: {item.fieldnames.join(", ")}
                </div>
              ) : null}
            </button>
          ))}

          {props.items.length === 0 && (
            <div className="text-sm text-muted-foreground">No linked doctypes found.</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



