/**
 * Form toolbar actions - Desk parity
 * 
 * Utilities for form actions like amend, rename, etc.
 * Based on: frappe/public/js/frappe/form/toolbar.js and form.js
 */

import { isDocumentAmended, updateDocumentTitle } from './document'

/**
 * Check if Amend action should be shown
 * 
 * Based on: frappe/public/js/frappe/form/toolbar.js::can_amend()
 * 
 * @param doc - Document
 * @param meta - DocType metadata
 * @param permissions - Document permissions
 * @returns true if Amend should be shown
 */
export function canAmend(doc: any, meta: any, permissions: any): boolean {
  // Document must be cancelled (docstatus === 2)
  if (doc.docstatus !== 2) {
    return false
  }
  
  // User must have amend permission
  if (!permissions?.amend) {
    return false
  }
  
  // DocType must be submittable
  if (!meta.is_submittable) {
    return false
  }
  
  return true
}

/**
 * Check if document has already been amended (gate double-amend)
 * 
 * Based on: frappe/public/js/frappe/form/toolbar.js and form.js amend_doc() checks
 * 
 * @param doctype - DocType name
 * @param docname - Document name
 * @returns Promise<boolean> - true if already amended
 */
export async function checkIsAmended(doctype: string, docname: string): Promise<boolean> {
  return await isDocumentAmended(doctype, docname)
}

/**
 * Check if Rename action should be shown
 * 
 * Based on: frappe/public/js/frappe/form/toolbar.js::can_rename()
 * 
 * @param doc - Document
 * @param meta - DocType metadata
 * @param permissions - Document permissions
 * @returns true if Rename should be shown
 */
export function canRename(doc: any, meta: any, permissions: any): boolean {
  // User must have write permission
  if (!permissions?.write) {
    return false
  }
  
  // DocType must allow rename
  if (!meta.allow_rename) {
    return false
  }
  
  // Document must not be new
  if (doc.__islocal) {
    return false
  }
  
  return true
}

/**
 * Rename a document (with optional merge)
 * 
 * Based on: frappe/public/js/frappe/form/toolbar.js::rename_document_title()
 * 
 * @param params - Rename parameters
 * @returns Rename result
 */
export async function renameDocument(params: {
  doctype: string
  docname: string
  newName?: string
  newTitle?: string
  merge?: boolean
  enqueue?: boolean
}): Promise<{ success: boolean; new_name?: string; error?: any }> {
  return await updateDocumentTitle(params)
}

/**
 * Check if title is editable (for inline title editing)
 * 
 * Based on: frappe/public/js/frappe/form/toolbar.js::is_title_editable()
 * 
 * @param doc - Document
 * @param meta - DocType metadata
 * @param permissions - Document permissions
 * @returns true if title can be edited inline
 */
export function isTitleEditable(doc: any, meta: any, permissions: any): boolean {
  const titleField = meta.title_field
  if (!titleField) return false
  
  // Check if naming rule prevents title editing
  if (
    meta.naming_rule === 'By fieldname' &&
    meta.autoname === `field:${titleField}` &&
    !meta.allow_rename
  ) {
    return false
  }
  
  // Must have write permission
  if (!permissions?.write) {
    return false
  }
  
  // Document must not be new
  if (doc.__islocal) {
    return false
  }
  
  // Get title field definition
  const titleFieldDef = meta.fields?.find((f: any) => f.fieldname === titleField)
  if (!titleFieldDef) return false
  
  // Title field must be Data type, not read-only, not set_only_once
  if (
    titleFieldDef.fieldtype === 'Data' &&
    !titleFieldDef.read_only &&
    !titleFieldDef.set_only_once
  ) {
    return true
  }
  
  return false
}

