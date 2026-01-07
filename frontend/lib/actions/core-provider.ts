/**
 * Core Action Provider
 * 
 * Generates standard actions for all DocTypes using only official Frappe/ERPNext APIs.
 * This provider covers the generic toolbar actions that work across all doctypes.
 * 
 * Based on: frappe/public/js/frappe/form/toolbar.js and frappe/public/js/frappe/form/form.js
 */

import type { ActionProvider, Action, ActionContext } from './types'
import { getDocType, getDocument, saveDocument, cancelDocument, deleteDocument, updateDocumentTitle, isDocumentAmended } from '@/lib/api/document'
import { downloadPDF, openPrintPreview } from '@/lib/api/print'
import { composeEmail } from '@/lib/api/email'
import { applyWorkflow } from '@/lib/api/workflow'
import { slugify } from '@/lib/utils/workspace'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { toast } from 'sonner'
import { scrollToField } from '@/components/forms/FieldRenderer'
import { showDeskAlert } from '@/lib/utils/desk-alert'

function buildNoCopyFieldSet(meta: any): Set<string> {
  const s = new Set<string>()
  for (const f of meta?.fields || []) {
    if (f?.fieldname && (f?.no_copy === 1 || f?.no_copy === true)) {
      s.add(f.fieldname)
    }
  }
  return s
}

function stripSystemFields(doc: any): any {
  if (!doc || typeof doc !== 'object') return doc
  const out: any = Array.isArray(doc) ? [] : { ...doc }
  // Parent/system fields to strip for duplicates (Desk copy_doc behavior)
  delete out.name
  delete out.owner
  delete out.creation
  delete out.modified
  delete out.modified_by
  delete out.docstatus
  delete out.idx
  delete out.amended_from
  delete out.__islocal
  delete out.__unsaved
  delete out.__onload
  delete out.__run_link_triggers
  return out
}

async function buildDuplicateDoc(ctx: ActionContext): Promise<any> {
  const doctype = ctx.doctype
  const name = ctx.doc.name

  // Load a fresh copy (Desk would have full doc; ctx.doc may be partial)
  const loaded = await getDocument(doctype, name)
  if (!loaded.success || !loaded.doc) {
    throw new Error(loaded.error?.message || 'Failed to load document for duplicate')
  }

  const parentMeta = ctx.meta
  const parentNoCopy = buildNoCopyFieldSet(parentMeta)

  // Collect child table meta (for child no_copy fields)
  const tableFields = (parentMeta?.fields || []).filter((f: any) => f?.fieldtype === 'Table' && !!f?.options)
  const childNoCopyByDoctype = new Map<string, Set<string>>()
  for (const tf of tableFields) {
    const childDt = String(tf.options)
    if (!childNoCopyByDoctype.has(childDt)) {
      const childMetaResult = await getDocType(childDt)
      const childMeta = childMetaResult.success ? childMetaResult.meta : null
      childNoCopyByDoctype.set(childDt, buildNoCopyFieldSet(childMeta))
    }
  }

  // Start with a shallow dict and strip system fields
  const src = loaded.doc
  let dup = stripSystemFields(src)
  dup.doctype = doctype
  dup.docstatus = 0
  dup.__islocal = 1
  dup.__unsaved = 1

  // Strip no_copy fields on parent
  for (const fieldname of parentNoCopy) {
    delete dup[fieldname]
  }

  // Strip child system fields and no_copy fields for each table
  for (const tf of tableFields) {
    const fieldname = tf.fieldname
    const childDt = String(tf.options)
    const childNoCopy = childNoCopyByDoctype.get(childDt) || new Set<string>()
    const rows = dup[fieldname]
    if (!Array.isArray(rows)) continue

    dup[fieldname] = rows.map((row: any) => {
      const clean = stripSystemFields(row)
      // Child table standard fields
      delete clean.parent
      delete clean.parenttype
      delete clean.parentfield
      delete clean.doctype // keep? child row usually has doctype; safe to preserve
      delete clean.docstatus
      delete clean.idx
      for (const fn of childNoCopy) {
        delete clean[fn]
      }
      return clean
    })
  }

  return dup
}

/**
 * Core action provider - implements generic DocType actions
 */
export const coreActionProvider: ActionProvider = {
  name: 'CoreActionProvider',
  
  getActions: async (ctx: ActionContext): Promise<Action[]> => {
    const actions: Action[] = []
    const { doc, meta, docinfo, workflowTransitions, refetch, navigate } = ctx
    const isNew = !doc || doc.__islocal
    
    // ========================================================================
    // PRIMARY ACTIONS (Save/Submit)
    // ========================================================================
    
    // Save action (always available for new or draft docs)
    if (isNew || doc.docstatus === 0) {
      actions.push({
        id: 'save',
        label: 'Save',
        group: 'primary',
        primary: true,
        priority: 1,
        icon: 'Save',
        requires: [
          { permission: isNew ? 'create' : 'write' }
        ],
        execute: async (ctx) => {
          // Desk parity: toolbar Save delegates to the live form state when available
          if (ctx.form?.submit) {
            await ctx.form.submit('Save')
            return
          }

          // Fallback (should be rare): save stale ctx.doc
          const result = await saveDocument(ctx.doc, 'Save')
          if (result.success && result.doc) {
            // Navigate to saved document if it was new
            if (isNew && ctx.navigate && result.doc.name) {
              ctx.navigate(`/app/${slugify(ctx.doctype)}/${result.doc.name}`)
            } else if (ctx.refetch) {
              await ctx.refetch()
            }
          } else if (result.error) {
            throw new Error(result.error.message)
          }
        }
      })
    }
    
    // Submit action (for submittable doctypes in draft state)
    if (!isNew && meta.is_submittable && doc.docstatus === 0) {
      actions.push({
        id: 'submit',
        label: 'Submit',
        group: 'primary',
        primary: true,
        priority: 2,
        icon: 'Check',
        requires: [
          { permission: 'submit' },
          { docstatus: 0 }
        ],
        confirm: {
          message: 'Are you sure you want to submit this document? Submitted documents cannot be edited.',
          title: 'Submit Document',
          type: 'warning'
        },
        execute: async (ctx) => {
          // Desk parity: submit should validate and submit current form state
          if (ctx.form?.submit) {
            await ctx.form.submit('Submit')
            return
          }

          // Fallback
          const result = await saveDocument(ctx.doc, 'Submit')
          if (result.success && ctx.refetch) {
            await ctx.refetch()
          } else if (result.error) {
            throw new Error(result.error.message)
          }
        }
      })
    }
    
    // Cancel action (for submitted docs)
    if (!isNew && meta.is_submittable && doc.docstatus === 1) {
      actions.push({
        id: 'cancel',
        label: 'Cancel',
        group: 'primary',
        priority: 3,
        icon: 'X',
        requires: [
          { permission: 'cancel' },
          { docstatus: 1 }
        ],
        confirm: {
          message: 'Are you sure you want to cancel this document? This action cannot be undone.',
          title: 'Cancel Document',
          type: 'danger'
        },
        execute: async (ctx) => {
          const result = await cancelDocument(ctx.doctype, ctx.doc.name)
          if (result.success && ctx.refetch) {
            await ctx.refetch()
          } else if (result.error) {
            throw new Error(result.error.message)
          }
        }
      })
    }
    
    // Amend action (for cancelled docs)
    if (!isNew && meta.is_submittable && doc.docstatus === 2) {
      actions.push({
        id: 'amend',
        label: 'Amend',
        group: 'primary',
        priority: 4,
        icon: 'FileEdit',
        requires: [
          { permission: 'amend' },
          { docstatus: 2 }
        ],
        execute: async (ctx) => {
          // Check if already amended (this check happens in execute, not requirements)
          const alreadyAmended = await isDocumentAmended(ctx.doctype, ctx.doc.name)
          if (alreadyAmended) {
            throw new Error('This document has already been amended')
          }
          
          // Desk parity: amendment starts from a clean copy of the cancelled doc
          const amendedDoc = await buildDuplicateDoc(ctx)
          amendedDoc.amended_from = ctx.doc.name
          
          // Save as new
          const saveResult = await saveDocument(amendedDoc, 'Save')
          if (saveResult.success && saveResult.doc && ctx.navigate) {
            ctx.navigate(`/app/${slugify(ctx.doctype)}/${saveResult.doc.name}`)
          } else if (saveResult.error) {
            throw new Error(saveResult.error.message)
          }
        }
      })
    }
    
    // ========================================================================
    // WORKFLOW ACTIONS
    // ========================================================================
    
    if (!isNew && workflowTransitions && workflowTransitions.length > 0) {
      for (const transition of workflowTransitions) {
        actions.push({
          id: `workflow-${transition.action}`,
          label: transition.action,
          group: 'workflow',
          priority: 10,
          icon: 'GitBranch',
          execute: async (ctx) => {
            const result = await applyWorkflow(ctx.doc, transition.action)
            if (result.success && ctx.refetch) {
              await ctx.refetch()
            } else if (result.error) {
              throw new Error(result.error.message)
            }
          }
        })
      }
    }
    
    // ========================================================================
    // VIEW ACTIONS
    // ========================================================================
    
    // Reload action
    if (!isNew) {
      actions.push({
        id: 'reload',
        label: 'Reload',
        group: 'view',
        priority: 20,
        icon: 'RefreshCw',
        execute: async (ctx) => {
          if (ctx.refetch) {
            await ctx.refetch()
          }
        }
      })
    }
    
    // Copy to clipboard action
    actions.push({
      id: 'copy-to-clipboard',
      label: 'Copy to Clipboard',
      group: 'view',
      priority: 21,
      icon: 'Clipboard',
      execute: async (ctx) => {
        const url = `${window.location.origin}/app/${slugify(ctx.doctype)}/${ctx.doc.name}`
        await copyToClipboard(url)
        // Desk-style: only show success when copy actually succeeded
        showDeskAlert('Copied to clipboard', { indicator: 'green' })
      }
    })
    
    // Jump to field action (client-only, shows field selector)
    if (meta.fields && meta.fields.length > 0) {
      actions.push({
        id: 'jump-to-field',
        label: 'Jump to Field',
        group: 'view',
        priority: 22,
        icon: 'Navigation',
        execute: async (ctx) => {
          const fields = (ctx.meta.fields || [])
            .filter((f: any) => f?.fieldname && !['Section Break', 'Column Break', 'Tab Break'].includes(f.fieldtype))
            .filter((f: any) => f.fieldtype !== 'HTML')
            .map((f: any) => ({ fieldname: f.fieldname, label: f.label }))

          const res = await ctx.ui?.openJumpToField?.({ fields })
          if (!res) return
          scrollToField(res.fieldname)
        }
      })
    }
    
    // Links action (show linked documents)
    if (meta.__linked_with || meta.fields?.some((f: any) => f.fieldtype === 'Link')) {
      actions.push({
        id: 'links',
        label: 'Links',
        group: 'view',
        priority: 23,
        icon: 'Link2',
        showAsMenuItem: true,
        execute: async (ctx) => {
          await ctx.ui?.openLinks?.({ linkedWith: (ctx.meta as any).__linked_with || {} })
        }
      })
    }
    
    // ========================================================================
    // DOCUMENT ACTIONS (Rename/Duplicate/Delete)
    // ========================================================================
    
    // Rename action
    if (!isNew && meta.allow_rename) {
      actions.push({
        id: 'rename',
        label: 'Rename',
        group: 'document',
        priority: 30,
        icon: 'Edit3',
        showAsMenuItem: true,
        requires: [
          { permission: 'write' },
          { notNew: true }
        ],
        execute: async (ctx) => {
          // Desk parity: rename is dialog-driven. Cancel = no-op.
          const res = await ctx.ui?.openRename?.({ currentName: ctx.doc.name })
          if (!res) return

          const result = await updateDocumentTitle({
            doctype: ctx.doctype,
            docname: ctx.doc.name,
            name: res.newName,
            merge: res.merge,
          })

          if (result.success && result.new_name && ctx.navigate) {
            ctx.navigate(`/app/${slugify(ctx.doctype)}/${result.new_name}`)
          } else if (result.error) {
            throw new Error(result.error.message)
          }
        }
      })
    }
    
    // Duplicate action
    if (!isNew) {
      actions.push({
        id: 'duplicate',
        label: 'Duplicate',
        group: 'document',
        priority: 31,
        icon: 'Copy',
        showAsMenuItem: true,
        requires: [
          { permission: 'read' },
          { notNew: true }
        ],
        execute: async (ctx) => {
          const dup = await buildDuplicateDoc(ctx)
          const key = `duplicate:${ctx.doctype}:${ctx.doc.name}`
          sessionStorage.setItem(key, JSON.stringify(dup))

          // Desk UX: open a new unsaved document prefilled from the source doc
          const qp = new URLSearchParams({ duplicate_from: ctx.doc.name })
          ctx.navigate?.(`/app/${slugify(ctx.doctype)}/new?${qp.toString()}`)
        }
      })
    }
    
    // Delete action
    if (!isNew) {
      actions.push({
        id: 'delete',
        label: 'Delete',
        group: 'document',
        priority: 32,
        icon: 'Trash2',
        showAsMenuItem: true,
        requires: [
          { permission: 'delete' },
          { notNew: true }
        ],
        confirm: {
          message: `Are you sure you want to delete this ${ctx.doctype}?`,
          title: 'Delete Document',
          type: 'danger',
          requireTypedConfirmation: true
        },
        execute: async (ctx) => {
          const result = await deleteDocument(ctx.doctype, ctx.doc.name)
          if (result.success && ctx.navigate) {
            ctx.navigate(`/app/${slugify(ctx.doctype)}`)
          } else if (result.error) {
            throw new Error(result.error.message)
          }
        }
      })
    }
    
    // ========================================================================
    // PRINT ACTIONS
    // ========================================================================
    
    if (!isNew) {
      // Print/PDF action
      actions.push({
        id: 'print-pdf',
        label: 'Print',
        group: 'print',
        priority: 40,
        icon: 'Printer',
        requires: [
          { permission: 'print' },
          { notNew: true }
        ],
        execute: async (ctx) => {
          // Open print preview
          openPrintPreview({
            doctype: ctx.doctype,
            name: ctx.doc.name
          })
        }
      })
      
      // Download PDF action
      actions.push({
        id: 'download-pdf',
        label: 'Download PDF',
        group: 'print',
        priority: 41,
        icon: 'Download',
        showAsMenuItem: true,
        requires: [
          { permission: 'print' },
          { notNew: true }
        ],
        execute: async (ctx) => {
          const result = await downloadPDF({
            doctype: ctx.doctype,
            name: ctx.doc.name
          })
          if (!result.success && result.error) {
            throw new Error(result.error.message)
          }
        }
      })
    }
    
    // ========================================================================
    // EMAIL ACTIONS
    // ========================================================================
    
    if (!isNew) {
      actions.push({
        id: 'email',
        label: 'Email',
        group: 'email',
        priority: 50,
        icon: 'Mail',
        requires: [
          { permission: 'email' },
          { notNew: true }
        ],
        execute: async (ctx) => {
          const input = await ctx.ui?.openEmail?.({ doctype: ctx.doctype, docname: ctx.doc.name })
          if (!input) return

          const result = await composeEmail({
            doctype: ctx.doctype,
            name: ctx.doc.name,
            recipients: input.recipients,
            cc: input.cc,
            bcc: input.bcc,
            subject: input.subject,
            content: input.content,
            send_now: true,
          })

          if (!result.success && result.error) {
            throw new Error(result.error.message)
          }

          showDeskAlert('Email sent', { indicator: 'green' })
        }
      })
    }
    
    // ========================================================================
    // NAVIGATION ACTIONS (Prev/Next)
    // ========================================================================
    
    // TODO: Implement get_next API wrapper and add prev/next actions
    // These would call frappe.desk.form.utils.get_next
    
    return actions
  }
}

/**
 * Get core actions for a document
 * Convenience wrapper around coreActionProvider
 */
export async function getCoreActions(ctx: ActionContext): Promise<Action[]> {
  return await coreActionProvider.getActions(ctx)
}
