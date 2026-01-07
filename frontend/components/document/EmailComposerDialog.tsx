"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export interface EmailComposerValue {
  recipients: string
  subject: string
  content: string
  cc?: string
  bcc?: string
}

export function EmailComposerDialog(props: {
  open: boolean
  doctype: string
  docname: string
  onCancel: () => void
  onSend: (value: EmailComposerValue) => void
}) {
  const [recipients, setRecipients] = React.useState("")
  const [subject, setSubject] = React.useState("")
  const [content, setContent] = React.useState("")
  const [cc, setCc] = React.useState("")
  const [bcc, setBcc] = React.useState("")

  React.useEffect(() => {
    if (props.open) {
      setRecipients("")
      setSubject("")
      setContent("")
      setCc("")
      setBcc("")
    }
  }, [props.open])

  const canSend =
    recipients.trim().length > 0 && subject.trim().length > 0 && content.trim().length > 0

  return (
    <Dialog open={props.open} onOpenChange={(o) => !o && props.onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Email: {props.doctype} {props.docname}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">To *</label>
            <Input value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="recipient@example.com" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">CC</label>
              <Input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="optional" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">BCC</label>
              <Input value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="optional" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Subject *</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Message *</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder="Write your message..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={props.onCancel}>
            Cancel
          </Button>
          <Button
            disabled={!canSend}
            onClick={() =>
              props.onSend({
                recipients: recipients.trim(),
                subject: subject.trim(),
                content: content.trim(),
                cc: cc.trim() || undefined,
                bcc: bcc.trim() || undefined,
              })
            }
          >
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



