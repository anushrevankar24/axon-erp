/**
 * Field Permission Utilities
 * 
 * Replicates ERPNext's field permission logic from:
 * - frappe/public/js/frappe/model/perm.js
 * - frappe/public/js/frappe/form/controls/base_control.js
 */

import { DocTypeMeta, DocField, DocPermission } from '@/lib/types/metadata'

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
 * This is a simplified version - full implementation would evaluate JS expressions
 */
export function evaluateDependsOn(
  field: DocField,
  doc: any
): boolean {
  if (!field.depends_on) return false
  
  // Simple evaluation: "eval:doc.fieldname"
  if (field.depends_on.startsWith('eval:')) {
    const condition = field.depends_on.replace('eval:', '')
    try {
      // Very basic evaluation - production would use safer parser
      // eslint-disable-next-line no-eval
      return !eval(condition.replace('doc.', 'doc?.'))
    } catch {
      return false
    }
  }
  
  // Simple field check: "fieldname"
  const value = doc[field.depends_on]
  return !value
}

