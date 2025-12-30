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
  userRoles: string[]
): PermissionMap {
  const perms: PermissionMap = {}
  
  // Administrator has all permissions
  if (userRoles.includes('Administrator')) {
    return {
      0: { permlevel: 0, read: true, write: true }
    }
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

/**
 * Get field display status - "Write", "Read", or "None"
 * Replicates frappe.perm.get_field_display_status()
 */
export function getFieldDisplayStatus(
  field: DocField,
  doc: any,
  perms: PermissionMap,
  docInfo?: any
): FieldDisplayStatus {
  // Get permissions for field's permlevel
  const permlevel = field.permlevel || 0
  const p = perms[permlevel]
  
  let status: FieldDisplayStatus = 'None'
  
  // Check permission at permlevel
  if (p) {
    if (p.write && !field.read_only) {
      status = 'Write'
    } else if (p.read) {
      status = 'Read'
    }
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

