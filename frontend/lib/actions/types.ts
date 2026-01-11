/**
 * DocType Action System - Type Definitions
 * 
 * This module defines the Action system primitives used to expose
 * ERPNext/Frappe capabilities in a declarative, API-driven manner.
 * 
 * Design principles:
 * - Actions are declarative (data, not code)
 * - Backend is authoritative for all enforcement
 * - UI uses meta/docinfo/workflow to decide visibility (UX only)
 * - All mutations call official whitelisted Frappe/ERPNext methods
 */

import type { DocTypeMeta, DocInfo } from '@/lib/types/metadata'

/**
 * Action requirement predicate (for UX gating only)
 * Server is still the final authority
 */
export interface ActionRequirement {
  /** Permission required from docinfo.permissions */
  permission?: 'read' | 'write' | 'create' | 'delete' | 'submit' | 'cancel' | 'amend' | 'print' | 'email' | 'share'
  /** DocType capability flag from meta */
  metaFlag?: keyof DocTypeMeta
  /** Document state requirement (docstatus) */
  docstatus?: 0 | 1 | 2 | number[]
  /** Document must not be new (__islocal) */
  notNew?: boolean
  /** Custom predicate function */
  custom?: (ctx: ActionContext) => boolean
}

/**
 * Confirmation requirement for dangerous actions
 */
export interface ActionConfirmation {
  /** Confirmation message */
  message: string
  /** Confirmation title */
  title?: string
  /** Type of confirmation (affects styling) */
  type?: 'warning' | 'danger' | 'info'
  /** Require typed confirmation (e.g., document name) */
  requireTypedConfirmation?: boolean
}

/**
 * Context passed to action handlers
 */
export interface ActionContext {
  /** Current logged-in user id (email/name). Required for Desk-parity DocShare permission merge. */
  currentUser?: string
  /** DocType name */
  doctype: string
  /** Document name (may be null for new docs) */
  docname: string | null
  /** Document data */
  doc: any
  /** DocType metadata */
  meta: DocTypeMeta
  /** Document info (permissions, attachments, etc.) */
  docinfo?: DocInfo
  /** Workflow transitions (if applicable) */
  workflowTransitions?: WorkflowTransition[]
  /** Refetch/reload function */
  refetch?: () => void | Promise<void>
  /** Navigate function */
  navigate?: (path: string) => void

  /**
   * Optional form handle (Desk parity: toolbar actions delegate to the form)
   * - Avoids stale ctx.doc by submitting current form state
   */
  form?: {
    submit: (action?: 'Save' | 'Submit' | 'Update') => Promise<void>
    isDirty?: boolean
    isSubmitting?: boolean
  }

  /**
   * Optional UI delegates for actions that are dialog-driven in Desk
   * (Rename, Jump to field, Links, Email composer, etc.)
   */
  ui?: {
    openRename?: (params: { currentName: string }) => Promise<{ newName: string; merge: boolean } | null>
    openJumpToField?: (params: {
      fields: Array<{ fieldname: string; label?: string }>
    }) => Promise<{ fieldname: string } | null>
    openLinks?: (params: { linkedWith: Record<string, string[] | undefined> }) => Promise<void>
    openEmail?: (params: { doctype: string; docname: string }) => Promise<{
      recipients: string
      subject: string
      content: string
      cc?: string
      bcc?: string
    } | null>
  }
}

/**
 * Workflow transition from frappe.model.workflow.get_transitions
 */
export interface WorkflowTransition {
  /** Action name */
  action: string
  /** Target state */
  state: string
  /** Allowed roles */
  allowed?: string
  /** Condition (if any) */
  condition?: string
}

/**
 * Action definition
 * Represents a capability that can be exposed in the UI
 */
export interface Action {
  /** Unique action ID */
  id: string
  /** Display label */
  label: string
  /** Action group for organization (View, Actions, Print, etc.) */
  group: ActionGroup
  /** Icon (optional, lucide-react name) */
  icon?: string
  /** Requirements for showing this action (UX only) */
  requires?: ActionRequirement[]
  /** Confirmation requirement (for dangerous actions) */
  confirm?: ActionConfirmation
  /** Execute the action */
  execute: (ctx: ActionContext) => Promise<void> | void
  /** Priority/order within group (lower = earlier) */
  priority?: number
  /** Whether this is a primary action (e.g., Save) */
  primary?: boolean
  /** Whether to show as a menu item vs button */
  showAsMenuItem?: boolean
}

/**
 * Action groups for organizing the UI
 */
export type ActionGroup = 
  | 'primary'      // Primary actions (Save, Submit, etc.)
  | 'view'         // View-related (Reload, Copy to Clipboard, Jump to field)
  | 'actions'      // Generic actions dropdown
  | 'workflow'     // Workflow transitions
  | 'navigation'   // Next/Previous
  | 'document'     // Document operations (Rename, Duplicate, Delete)
  | 'print'        // Print/PDF
  | 'email'        // Email
  | 'more'         // Overflow menu

/**
 * Action manifest - complete set of actions for a document
 */
export interface ActionManifest {
  /** All available actions */
  actions: Action[]
  /** Context used to generate these actions */
  context: ActionContext
}

/**
 * Action provider interface
 * Providers generate actions based on context
 */
export interface ActionProvider {
  /** Provider name (for debugging) */
  name: string
  /** Generate actions for the given context */
  getActions: (ctx: ActionContext) => Action[] | Promise<Action[]>
  /** Whether this provider applies to the given doctype (optional filter) */
  appliesTo?: (doctype: string) => boolean
}

/**
 * Helper to check if action requirements are met (for UX)
 */
export function checkActionRequirements(
  requirements: ActionRequirement[] | undefined,
  ctx: ActionContext
): boolean {
  if (!requirements || requirements.length === 0) return true

  const getEffectiveDocPermissions = (): any | null => {
    const base = ctx.docinfo?.permissions
    if (!base) return null

    // Desk parity: apply DocShare grants from docinfo.shared for current user
    // Source: frappe/public/js/frappe/model/perm.js (shared merge)
    const user = ctx.currentUser
    const shared = Array.isArray((ctx.docinfo as any)?.shared) ? (ctx.docinfo as any).shared : []
    const row = user ? shared.find((s: any) => s?.user === user) : null
    if (!row) return base

    const merged: any = { ...base }
    for (const right of ['read', 'write', 'submit', 'share']) {
      if (!merged[right] && row?.[right]) {
        merged[right] = row[right]
      }
    }
    return merged
  }

  const effectiveDocPermissions = getEffectiveDocPermissions()

  return requirements.every(req => {
    // Permission check
    if (req.permission && ctx.docinfo) {
      // 'create' is not in docinfo.permissions (it's doctype-level, not document-level)
      // For new documents, create permission should be checked separately
      if (req.permission === 'create') {
        // Skip create check here - it's handled at doctype level, not document level
        // For new docs, we don't have docinfo yet anyway
        return true
      }
      
      // Type-safe permission access
      const permissions = effectiveDocPermissions || ctx.docinfo.permissions
      if (permissions && req.permission in permissions) {
        const hasPermission = permissions[req.permission as keyof typeof permissions]
        if (!hasPermission) return false
      }
    }

    // Meta flag check
    if (req.metaFlag) {
      const flagValue = ctx.meta[req.metaFlag]
      if (!flagValue) return false
    }

    // Docstatus check
    if (req.docstatus !== undefined) {
      const requiredStatuses = Array.isArray(req.docstatus) ? req.docstatus : [req.docstatus]
      if (!requiredStatuses.includes(ctx.doc.docstatus)) return false
    }

    // Not new check
    if (req.notNew && ctx.doc.__islocal) {
      return false
    }

    // Custom predicate
    if (req.custom && !req.custom(ctx)) {
      return false
    }

    return true
  })
}

/**
 * Helper to sort actions by priority and group
 */
export function sortActions(actions: Action[]): Action[] {
  return [...actions].sort((a, b) => {
    // Primary actions first
    if (a.primary && !b.primary) return -1
    if (!a.primary && b.primary) return 1
    
    // Then by priority
    const priorityA = a.priority ?? 1000
    const priorityB = b.priority ?? 1000
    if (priorityA !== priorityB) return priorityA - priorityB
    
    // Then by label
    return a.label.localeCompare(b.label)
  })
}

