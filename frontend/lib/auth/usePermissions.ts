import { useBoot } from '@/lib/api/hooks'

/**
 * usePermissions Hook - Check user permissions
 * 
 * Replicates frappe.perm.has_perm() from ERPNext
 * Pattern from: frappe/public/js/frappe/model/perm.js
 * 
 * Permissions come from boot data:
 * - boot.user.can_read: [DocType, ...]
 * - boot.user.can_write: [DocType, ...]
 * - boot.user.can_create: [DocType, ...]
 * - boot.user.can_delete: [DocType, ...]
 */
export function usePermissions() {
  const { data: boot } = useBoot()
  
  /**
   * Check if user has permission for a doctype
   * 
   * @param doctype - DocType name (e.g., "Sales Order")
   * @param ptype - Permission type
   * @returns boolean - true if user has permission
   */
  const has_perm = (
    doctype: string, 
    ptype: 'read' | 'write' | 'create' | 'delete' | 'submit' | 'cancel' | 'print' | 'email' | 'import' | 'export' = 'read'
  ): boolean => {
    if (!boot?.user || boot.user === 'Guest') {
      return false
    }
    
    // Administrator has all permissions (ERPNext pattern)
    if (boot.user.name === 'Administrator') {
      return true
    }
    
    // Check permission from boot data
    switch (ptype) {
      case 'read':
        return boot.user.can_read?.includes(doctype) || false
      case 'write':
        return boot.user.can_write?.includes(doctype) || false
      case 'create':
        return boot.user.can_create?.includes(doctype) || false
      case 'delete':
        return boot.user.can_delete?.includes(doctype) || false
      case 'submit':
        return boot.user.can_submit?.includes(doctype) || false
      case 'cancel':
        return boot.user.can_cancel?.includes(doctype) || false
      case 'print':
        return boot.user.can_print?.includes(doctype) || false
      case 'email':
        return boot.user.can_email?.includes(doctype) || false
      case 'import':
        return boot.user.can_import?.includes(doctype) || false
      case 'export':
        return boot.user.can_export?.includes(doctype) || false
      default:
        return false
    }
  }
  
  // Convenience methods (like ERPNext helpers)
  const canCreate = (doctype: string) => has_perm(doctype, 'create')
  const canRead = (doctype: string) => has_perm(doctype, 'read')
  const canWrite = (doctype: string) => has_perm(doctype, 'write')
  const canDelete = (doctype: string) => has_perm(doctype, 'delete')
  const canSubmit = (doctype: string) => has_perm(doctype, 'submit')
  const canCancel = (doctype: string) => has_perm(doctype, 'cancel')
  const canPrint = (doctype: string) => has_perm(doctype, 'print')
  const canEmail = (doctype: string) => has_perm(doctype, 'email')
  
  return {
    has_perm,
    canCreate,
    canRead,
    canWrite,
    canDelete,
    canSubmit,
    canCancel,
    canPrint,
    canEmail,
  }
}

