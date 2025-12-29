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
  
  // Handle eval: expressions
  if (field.depends_on.startsWith('eval:')) {
    const expression = field.depends_on.replace('eval:', '')
    try {
      // Create evaluation context with helper functions
      const context = {
        doc: doc || {},
        // Add ERPNext helper functions used in depends_on
        in_list: (list: any[], value: any) => Array.isArray(list) && list.includes(value),
        cint: (value: any) => parseInt(value) || 0,
        flt: (value: any) => parseFloat(value) || 0,
        // Add more as needed
      }
      
      // Safe evaluation using Function constructor (safer than eval)
      const evalFunc = new Function('doc', 'in_list', 'cint', 'flt', `
        try {
          return ${expression}
        } catch (e) {
          console.warn('depends_on evaluation failed:', '${expression}', e);
          return true; // Show field on error
        }
      `)
      
      const result = evalFunc(context.doc, context.in_list, context.cint, context.flt)
      return !result  // Return true to HIDE field
    } catch (e) {
      console.warn('Failed to evaluate depends_on:', expression, e)
      return false  // Show field if evaluation fails
    }
  }
  
  // Simple field check: "fieldname"
  // Check if field has truthy value
  const value = doc[field.depends_on]
  
  // ERPNext logic: field is hidden if depends_on value is falsy
  // But consider 0 as falsy, null/undefined as falsy
  if (value === null || value === undefined || value === '' || value === 0 || value === false) {
    return true  // Hide field
  }
  
  return false  // Show field
}

