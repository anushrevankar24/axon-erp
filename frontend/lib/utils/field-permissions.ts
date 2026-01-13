/**
 * Field Permission Utilities
 * 
 * Replicates ERPNext's field permission logic from:
 * - frappe/public/js/frappe/model/perm.js
 * - frappe/public/js/frappe/form/controls/base_control.js
 */

import { DocTypeMeta, DocField, DocPermission } from '@/lib/types/metadata'
import { evaluateDependsOnValue } from '@/lib/form/depends_on'
import type { DependencyStateMap } from '@/lib/form/dependency_state'

export type FieldDisplayStatus = 'Write' | 'Read' | 'None'

interface PermissionMap {
  [permlevel: number]: {
    read: boolean
    write: boolean
    permlevel: number
    rights_without_if_owner?: Set<string>
  }
}

/**
 * Calculate permission map from DocType meta and user roles
 * Replicates frappe.perm.get_role_permissions()
 */
export function calculatePermissions(
  meta: DocTypeMeta,
  userRoles: string[],
  currentUserId?: string
): PermissionMap {
  // Desk parity: always have a permlevel 0 object, even if no role matches.
  // (Frappe JS: starts with [{ read: 0, permlevel: 0 }])
  const perms: PermissionMap = {
    0: {
      permlevel: 0,
      read: false,
      write: false,
      rights_without_if_owner: new Set(),
    },
  }
  
  // Desk parity: Administrator user OR Administrator role has all permissions.
  // Sources:
  // - Server: frappe/permissions.py -> if user == "Administrator": return True
  // - Client: frappe/public/js/frappe/model/perm.js -> user === "Administrator" || frappe.user_roles.includes("Administrator")
  if (currentUserId === 'Administrator' || userRoles.includes('Administrator')) {
    // Grant permissions for permlevels 0-10 (covers all standard use cases)
    for (let level = 0; level <= 10; level++) {
      perms[level] = { 
        permlevel: level, 
        read: true, 
        write: true,
        rights_without_if_owner: new Set(['read', 'write'])
      }
    }
    return perms
  }
  
  // Filter permissions by user's roles
  const applicablePerms = meta.permissions?.filter(p => 
    userRoles.includes(p.role)
  ) || []
  
  // Group by permlevel
  applicablePerms.forEach(p => {
    const level = p.permlevel || 0
    
    if (!perms[level]) {
      perms[level] = { 
        permlevel: level, 
        read: false, 
        write: false,
        rights_without_if_owner: new Set()
      }
    }
    
    // OR logic - if ANY role grants permission, user has it
    if (p.read) perms[level].read = true
    if (p.write) perms[level].write = true
    
    // Track permissions without if_owner flag
    if (level === 0 && !p.if_owner) {
      if (p.read) perms[level].rights_without_if_owner?.add('read')
      if (p.write) perms[level].rights_without_if_owner?.add('write')
    }
  })

  return perms
}

function getSharedRightsForUser(docInfo: any, currentUser?: string) {
  if (!currentUser) return null
  const shared = Array.isArray(docInfo?.shared) ? docInfo.shared : []
  const row = shared.find((s: any) => s?.user === currentUser)
  if (!row) return null
  return {
    read: !!row.read,
    write: !!row.write,
    submit: !!row.submit,
    share: !!row.share,
  }
}

/**
 * Get field display status - "Write", "Read", or "None"
 * Replicates frappe.perm.get_field_display_status()
 */
export function getFieldDisplayStatus(
  field: DocField,
  doc: any,
  perms: PermissionMap,
  docInfo?: any,
  currentUser?: string
): FieldDisplayStatus {
  // Get permissions for field's permlevel
  const permlevel = field.permlevel || 0
  const p = perms[permlevel]

  // Desk parity:
  // - Base role perms come from DocType meta (per permlevel).
  // - For permlevel 0, doc-level permissions (docinfo.permissions) override base role perms.
  // - DocShare grants (docinfo.shared) are applied on top (can upgrade read/write).
  let canRead = !!p?.read
  let canWrite = !!p?.write && !field.read_only

  if (permlevel === 0 && docInfo?.permissions) {
    const docPerms = docInfo.permissions
    if (typeof docPerms.read === 'number' || typeof docPerms.read === 'boolean') {
      canRead = !!docPerms.read
    }
    if (typeof docPerms.write === 'number' || typeof docPerms.write === 'boolean') {
      canWrite = !!docPerms.write && !field.read_only
    }
  }

  if (permlevel === 0) {
    const sharedRights = getSharedRightsForUser(docInfo, currentUser)
    if (sharedRights) {
      // Match Desk: only upgrade if not already granted.
      if (!canRead && sharedRights.read) canRead = true
      if (!canWrite && sharedRights.write && !field.read_only) canWrite = true
    }
  }

  let status: FieldDisplayStatus = 'None'
  if (canWrite && !(field as any).disabled && !(field as any).is_virtual) {
    status = 'Write'
  } else if (canRead) {
    status = 'Read'
  }
  
  // Apply field-level overrides
  if (field.hidden) status = 'None'
  if ((field as any).hidden_due_to_dependency) status = 'None'
  
  // ERPNext pattern: Check doc existence BEFORE accessing properties
  // Source: frappe/public/js/frappe/model/perm.js line 226
  if (!doc) {
    return status  // Return permission-based status if no doc yet
  }
  
  // For new documents, skip document-status checks
  if (doc.__islocal) {
    return status
  }
  
  // If document is submitted (docstatus = 1), make read-only
  if (status === 'Write' && doc.docstatus === 1) {
    status = 'Read'
  }
  
  // Unless field has allow_on_submit
  if (status === 'Read' && field.allow_on_submit && 
      doc.docstatus === 1 && p?.write) {
    status = 'Write'
  }
  
  // Check read_only flag
  if (status === 'Write' && field.read_only) {
    status = 'Read'
  }
  
  return status
}

/**
 * Check if field should be hidden based on depends_on
 * 
 * Replicates ERPNext's logic from:
 * - frappe/public/js/frappe/ui/form/layout.js: evaluate_depends_on_value()
 * 
 * Supports:
 * - Simple field check: "enabled"
 * - eval expressions: "eval:doc.field == 'value'"
 * - Complex conditions: "eval:doc.field1 && doc.field2"
 */
export function evaluateDependsOn(
  field: DocField,
  doc: any
): boolean {
  if (!field.depends_on) return false

  // Desk does not evaluate dependencies without a document.
  // DynamicForm now blocks render until doc is available, but keep this guard for safety.
  if (!doc) return false
  
  const guardianHasValue = !!evaluateDependsOnValue(field.depends_on as any, { doc })
  // Frappe semantics: hide when guardian is false.
  return !guardianHasValue
}

export function applyDependencyOverrides(field: DocField, deps?: DependencyStateMap[string]): DocField {
  if (!deps) return field

  const next: any = { ...field }
  if (deps.hidden_due_to_dependency !== undefined) {
    // Frappe stores this as 0/1 on df
    next.hidden_due_to_dependency = deps.hidden_due_to_dependency ? 1 : 0
  }
  if (deps.reqd !== undefined) {
    next.reqd = deps.reqd
  }
  if (deps.read_only !== undefined) {
    next.read_only = deps.read_only
  }
  return next as DocField
}

