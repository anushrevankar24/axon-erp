/**
 * Quick Entry utilities - Desk parity
 * 
 * Based on: frappe/public/js/frappe/form/quick_entry.js
 */

import { clientSave, clientSubmit, type DocumentSaveResult } from './document'

/**
 * Check if a DocType should use quick entry
 * 
 * Based on: frappe/public/js/frappe/form/quick_entry.js::is_quick_entry()
 * 
 * @param meta - DocType metadata
 * @param mandatoryFields - Array of mandatory/quick-entry fields
 * @returns true if quick entry should be used
 */
export function shouldUseQuickEntry(meta: any, mandatoryFields: any[]): boolean {
  // Quick entry disabled in meta
  if (meta.quick_entry !== 1) {
    return false
  }
  
  // Has child tables (not supported in quick entry)
  const hasChildTable = mandatoryFields.some(f => f.fieldtype === 'Table')
  if (hasChildTable) {
    return false
  }
  
  // No mandatory fields (nothing to show)
  if (!mandatoryFields || mandatoryFields.length === 0) {
    return false
  }
  
  // Too many mandatory fields (> 7 fields, show full form)
  if (mandatoryFields.length > 7) {
    return false
  }
  
  return true
}

/**
 * Get quick entry fields from meta
 * 
 * Based on: frappe/public/js/frappe/form/quick_entry.js::set_meta_and_mandatory_fields()
 * 
 * @param meta - DocType metadata
 * @returns Array of fields to show in quick entry
 */
export function getQuickEntryFields(meta: any): any[] {
  if (!meta || !meta.fields) return []
  
  const fields = meta.fields.filter((df: any) => {
    return (
      (df.reqd || df.allow_in_quick_entry) &&
      !df.read_only &&
      !df.is_virtual &&
      df.fieldtype !== 'Tab Break'
    )
  })
  
  // Handle prompt autoname (add __newname field)
  if (meta.autoname && meta.autoname.toLowerCase() === 'prompt') {
    return [
      {
        fieldname: '__newname',
        label: `${meta.name} Name`,
        reqd: 1,
        fieldtype: 'Data',
      },
      ...fields
    ]
  }
  
  return fields
}

/**
 * Save a document using quick entry pattern (frappe.client.save)
 * 
 * Based on: frappe/public/js/frappe/form/quick_entry.js::insert()
 * 
 * @param doc - Document to save
 * @returns Save result
 */
export async function quickEntrySave(doc: Record<string, any>): Promise<DocumentSaveResult> {
  // Ensure __islocal flag for new documents
  const docToSave = {
    ...doc,
    __islocal: 1,
    __unsaved: 1,
  }
  
  return await clientSave(docToSave)
}

/**
 * Submit a document using quick entry pattern (frappe.client.submit)
 * 
 * Based on: frappe/public/js/frappe/form/quick_entry.js::submit()
 * 
 * @param doc - Document to submit (must already be saved)
 * @returns Submit result
 */
export async function quickEntrySubmit(doc: Record<string, any>): Promise<DocumentSaveResult> {
  return await clientSubmit(doc)
}

/**
 * Check if document can be submitted after quick entry save
 * 
 * Based on: frappe/public/js/frappe/form/quick_entry.js::insert() callback logic
 * 
 * @param doc - Saved document
 * @param meta - DocType metadata
 * @returns true if submit should be offered
 */
export function canQuickEntrySubmit(doc: any, meta: any): boolean {
  // Document must be draft (docstatus === 0)
  if (doc.docstatus !== 0) {
    return false
  }
  
  // DocType must be submittable
  if (!meta.is_submittable) {
    return false
  }
  
  // No workflow (workflow handles submission differently)
  if (meta.has_workflow) {
    return false
  }
  
  return true
}

