"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FormDashboard } from "./FormDashboard"
import { FormSidebar } from "./FormSidebar"
import { FormTimeline } from "./FormTimeline"
import { DynamicForm } from "../forms/DynamicForm"
import { DocumentHeaderActions } from "./DocumentHeaderActions"
import { RenameDialog } from "./RenameDialog"
import { JumpToFieldDialog } from "./JumpToFieldDialog"
import { LinksDialog, type LinkedWithItem } from "./LinksDialog"
import { EmailComposerDialog, type EmailComposerValue } from "./EmailComposerDialog"
import { useDoc, useDocWithInfo, useMeta, useWorkflowTransitions } from "@/lib/api/hooks"
import { buildActionManifest } from "@/lib/actions"
import type { ActionContext } from "@/lib/actions/types"
import { slugify } from "@/lib/utils/workspace"

interface DocumentLayoutProps {
  doctype: string
  id?: string
}

export function DocumentLayout({ doctype, id }: DocumentLayoutProps) {
  const router = useRouter()
  const isNew = !id || id === 'new'
  const [isDirty, setIsDirty] = React.useState(false)
  const [formRef, setFormRef] = React.useState<any>(null)
  const [renameOpen, setRenameOpen] = React.useState(false)
  const renameResolverRef = React.useRef<((v: { newName: string; merge: boolean } | null) => void) | null>(null)
  const [jumpOpen, setJumpOpen] = React.useState(false)
  const [jumpFields, setJumpFields] = React.useState<Array<{ fieldname: string; label?: string }>>([])
  const jumpResolverRef = React.useRef<((v: { fieldname: string } | null) => void) | null>(null)
  const [linksOpen, setLinksOpen] = React.useState(false)
  const [linkedWithItems, setLinkedWithItems] = React.useState<LinkedWithItem[]>([])
  const [emailOpen, setEmailOpen] = React.useState(false)
  const emailResolverRef = React.useRef<((v: EmailComposerValue | null) => void) | null>(null)

  // Fetch document data (for new docs)
  const { data: newDoc } = useDoc(doctype, isNew ? 'new' : undefined)
  
  // Fetch document with docinfo (for existing docs)
  const { data: docWithInfo, refetch: refetchDoc } = useDocWithInfo(doctype, !isNew ? id : undefined)
  
  // Fetch DocType metadata
  const { data: meta } = useMeta(doctype)
  
  // Determine which doc to use
  const doc = isNew ? newDoc : docWithInfo?.doc
  const docinfo = docWithInfo?.docinfo
  
  // Fetch workflow transitions (only for existing docs with workflow)
  const { data: workflowTransitions } = useWorkflowTransitions(doctype, doc)
  
  // Memoize refetch function - React Query's refetch is already stable, but we wrap it for consistency
  const refetch = React.useCallback(async () => {
    await refetchDoc()
  }, [refetchDoc])

  // Memoize navigate function - router.push is stable, but we wrap it for consistency
  const navigate = React.useCallback((path: string) => {
    router.push(path)
  }, [router])

  // Desk parity: dialog-driven actions.
  const openRename = React.useCallback(async ({ currentName }: { currentName: string }) => {
    setRenameOpen(true)
    return await new Promise<{ newName: string; merge: boolean } | null>((resolve) => {
      renameResolverRef.current = resolve
    })
  }, [])

  const openJumpToField = React.useCallback(
    async ({ fields }: { fields: Array<{ fieldname: string; label?: string }> }) => {
      setJumpFields(fields)
      setJumpOpen(true)
      return await new Promise<{ fieldname: string } | null>((resolve) => {
        jumpResolverRef.current = resolve
      })
    },
    []
  )

  const openLinks = React.useCallback(async ({ linkedWith }: { linkedWith: Record<string, string[] | undefined> }) => {
    const items: LinkedWithItem[] = Object.keys(linkedWith || {}).map((dt) => ({
      doctype: dt,
      fieldnames: (linkedWith[dt] || []).filter(Boolean) as string[],
    }))
    setLinkedWithItems(items)
    setLinksOpen(true)
  }, [])

  const openEmail = React.useCallback(async ({ doctype, docname }: { doctype: string; docname: string }) => {
    setEmailOpen(true)
    return await new Promise<EmailComposerValue | null>((resolve) => {
      emailResolverRef.current = resolve
    })
  }, [])

  // Build action context - only recreate when actual data changes
  // Use stable function references (refetch, navigate) that don't change
  const actionContext: ActionContext | null = React.useMemo(() => {
    if (!doc || !meta) return null
    
    return {
      doctype,
      docname: doc.name || null,
      doc,
      meta,
      docinfo,
      workflowTransitions: workflowTransitions || [],
      refetch,
      navigate,
      form: formRef || undefined,
      ui: {
        openRename,
        openJumpToField,
        openLinks,
        openEmail,
      }
    }
  }, [doc, meta, docinfo, workflowTransitions, doctype, refetch, navigate, formRef, openRename, openJumpToField, openLinks, openEmail])
  
  // Build action manifest - prevent concurrent builds and handle cleanup
  const [actionManifest, setActionManifest] = React.useState<any>(null)
  const buildingRef = React.useRef(false)
  
  React.useEffect(() => {
    if (!actionContext) {
      setActionManifest(null)
      return
    }

    // Prevent concurrent builds
    if (buildingRef.current) {
      return
    }

    let cancelled = false
    buildingRef.current = true

    buildActionManifest(actionContext)
      .then(manifest => {
        if (!cancelled) {
          setActionManifest(manifest)
        }
      })
      .catch(error => {
        console.error('[DocumentLayout] Error building action manifest:', error)
        if (!cancelled) {
          setActionManifest(null)
        }
      })
      .finally(() => {
        buildingRef.current = false
      })

    return () => {
      cancelled = true
      buildingRef.current = false
    }
  }, [actionContext])

  return (
    <div className="flex-1 w-full bg-gray-50 flex flex-col">
      {/* Desk parity: Rename dialog (invoked from toolbar actions) */}
      <RenameDialog
        open={renameOpen}
        currentName={doc?.name || ''}
        onCancel={() => {
          setRenameOpen(false)
          renameResolverRef.current?.(null)
          renameResolverRef.current = null
        }}
        onConfirm={(value) => {
          setRenameOpen(false)
          renameResolverRef.current?.(value)
          renameResolverRef.current = null
        }}
      />

      {/* Desk parity: Jump to Field dialog */}
      <JumpToFieldDialog
        open={jumpOpen}
        fields={jumpFields}
        onCancel={() => {
          setJumpOpen(false)
          jumpResolverRef.current?.(null)
          jumpResolverRef.current = null
        }}
        onSelect={(fieldname) => {
          setJumpOpen(false)
          jumpResolverRef.current?.({ fieldname })
          jumpResolverRef.current = null
        }}
      />

      {/* Desk parity: Links dialog */}
      <LinksDialog
        open={linksOpen}
        items={linkedWithItems}
        onClose={() => setLinksOpen(false)}
        onOpenDoctype={(item) => {
          // Desk parity: set route options so list view applies filter once.
          // We use the first linking fieldname if available.
          const linkField = item.fieldnames?.[0]
          if (linkField && doc?.name) {
            sessionStorage.setItem('route_options', JSON.stringify({ [linkField]: doc.name }))
          }
          setLinksOpen(false)
          router.push(`/app/${slugify(item.doctype)}`)
        }}
      />

      {/* Desk parity: Email composer */}
      <EmailComposerDialog
        open={emailOpen}
        doctype={doctype}
        docname={doc?.name || ''}
        onCancel={() => {
          setEmailOpen(false)
          emailResolverRef.current?.(null)
          emailResolverRef.current = null
        }}
        onSend={(value) => {
          setEmailOpen(false)
          emailResolverRef.current?.(value)
          emailResolverRef.current = null
        }}
      />

      {/* Document Title Bar - Dynamic Actions */}
      <div className="border-b bg-white px-4 py-3 flex items-center justify-between sticky top-[var(--header-height)] z-10">
        {/* Left: Document Name */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          
          <h1 className="text-lg font-semibold">
            {isNew ? `New ${doctype}` : (doc?.name || id || doctype)}
          </h1>
          
          {isDirty && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
              Not Saved
            </span>
          )}
        </div>

        {/* Right: Dynamic Actions */}
        {actionManifest && actionContext && (
          <DocumentHeaderActions
            actions={actionManifest.actions}
            context={actionContext}
            isDirty={isDirty}
          />
        )}
      </div>

      {/* Dashboard (Connections) - Only show after save */}
      {!isNew && id && (
        <FormDashboard doctype={doctype} docname={id} />
      )}

      {/* Main Content Area - No nested scroll, body handles scrolling */}
      <div className="flex-1 flex min-h-0">
        {/* Form Content - flows naturally */}
        <div className="flex-1 w-full">
          <div className="px-4 py-3 max-w-7xl mx-auto">
            <DynamicForm 
              doctype={doctype} 
              id={id}
              onFormReady={setFormRef}
              onDirtyChange={setIsDirty}
            />
          </div>

          {/* Timeline (Activity & Comments) - Only show after save */}
          {!isNew && id && (
            <FormTimeline doctype={doctype} docname={id} />
          )}
        </div>

        {/* Sidebar - Only show after save */}
        {!isNew && id && (
          <FormSidebar doctype={doctype} docname={id} doc={doc} />
        )}
      </div>
    </div>
  )
}

