/**
 * Document API - ERPNext Production Pattern
 * 
 * Uses Desk API (/api/method/frappe.desk.form.*) instead of REST API (/api/resource/*)
 * This provides full validation, proper error messages, and all form-level events.
 * 
 * Based on:
 * - frappe/desk/form/save.py (savedocs, cancel)
 * - frappe/desk/form/load.py (getdoc, getdoctype, get_docinfo)
 * - frappe/public/js/frappe/form/save.js
 */

import { call } from './client'
import { parseFrappeError, type FrappeError } from '@/lib/utils/errors'
import { parseUserSettings } from '@/lib/user-settings/normalize'

// ============================================================================
// Types
// ============================================================================

export interface DocumentSaveResult {
  success: boolean
  doc?: any
  docinfo?: any
  message?: string
  error?: FrappeError
}

export interface DocumentLoadResult {
  success: boolean
  doc?: any
  docinfo?: any
  error?: FrappeError
}

export interface DocTypeLoadResult {
  success: boolean
  meta?: any
  docs?: any[]
  user_settings?: any
  error?: FrappeError
}

export type SaveAction = 'Save' | 'Submit' | 'Update' | 'Cancel'

// ============================================================================
// Document Save Operations
// ============================================================================

/**
 * Save a document using the Desk API (same as ERPNext)
 * 
 * This calls frappe.desk.form.save.savedocs which:
 * - Runs full validation (_validate_mandatory, _validate_data_fields, etc.)
 * - Triggers all form events (validate, before_save, on_update, etc.)
 * - Returns detailed error messages in _server_messages
 * 
 * @param doc - Document data including doctype
 * @param action - Save action: 'Save', 'Submit', 'Update'
 */
export async function saveDocument(
  doc: Record<string, any>,
  action: SaveAction = 'Save'
): Promise<DocumentSaveResult> {
  try {
    // Prepare document for Desk API
    // __islocal flag tells Frappe this is a new document
    const isNew = !doc.name || doc.__islocal
    
    // If new document without a name, generate a temporary name
    // Frappe expects format: "new-{doctype-lowercase}-{random}"
    let docName = doc.name
    if (isNew && !doc.name) {
      docName = `new-${doc.doctype.toLowerCase().replace(/ /g, '-')}-${Date.now()}`
    }
    
    const docToSave = {
      ...doc,
      name: docName,
      __islocal: isNew ? 1 : undefined,
      __unsaved: 1,
    }

    const result = await call('frappe.desk.form.save.savedocs', {
      doc: JSON.stringify(docToSave),
      action
    })

    // Response structure from savedocs:
    // - result.docs: Array of saved documents
    // - result.docinfo: Document info (attachments, comments, etc.)
    // - result.message: Alert message (e.g., "Saved")
    const savedDoc = result.docs?.[0] || result.message?.docs?.[0]
    const docinfo = result.docinfo || result.message?.docinfo

    return {
      success: true,
      doc: savedDoc,
      docinfo,
      message: typeof result.message === 'string' ? result.message : 'Saved'
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Cancel a submitted document
 * 
 * @param doctype - DocType name
 * @param name - Document name
 */
export async function cancelDocument(
  doctype: string,
  name: string
): Promise<DocumentSaveResult> {
  try {
    const result = await call('frappe.desk.form.save.cancel', {
      doctype,
      name
    })

    const cancelledDoc = result.docs?.[0] || result.message?.docs?.[0]

    return {
      success: true,
      doc: cancelledDoc,
      message: 'Cancelled'
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Delete a document
 * 
 * @param doctype - DocType name
 * @param name - Document name
 */
export async function deleteDocument(
  doctype: string,
  name: string
): Promise<{ success: boolean; error?: FrappeError }> {
  try {
    await call('frappe.client.delete', {
      doctype,
      name
    })

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

// ============================================================================
// Document Load Operations
// ============================================================================

/**
 * Load a document with full docinfo (attachments, comments, versions, etc.)
 * 
 * This calls frappe.desk.form.load.getdoc which:
 * - Loads the document and all child tables
 * - Runs onload events
 * - Returns docinfo with attachments, comments, assignments, etc.
 * 
 * @param doctype - DocType name
 * @param name - Document name
 */
export async function getDocument(
  doctype: string,
  name: string
): Promise<DocumentLoadResult> {
  try {
    const result = await call('frappe.desk.form.load.getdoc', {
      doctype,
      name
    })

    // Response structure from getdoc:
    // - result.docs: Array containing the document
    // - result.docinfo: Document info (attachments, comments, etc.)
    const doc = result.docs?.[0] || result.message?.docs?.[0]
    const docinfo = result.docinfo || result.message?.docinfo

    if (!doc) {
      return {
        success: false,
        error: {
          message: `${doctype} ${name} not found`,
          title: 'Not Found',
          type: 'validation',
          indicator: 'red'
        }
      }
    }

    return {
      success: true,
      doc,
      docinfo
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Load DocType metadata with all linked DocTypes
 * 
 * This calls frappe.desk.form.load.getdoctype which:
 * - Returns the DocType meta (fields, permissions, etc.)
 * - Returns all child table DocType metas
 * - Returns user settings for the DocType
 * 
 * @param doctype - DocType name
 * @param withParent - Include parent DocType (for child tables)
 */
export async function getDocType(
  doctype: string,
  withParent: boolean = false
): Promise<DocTypeLoadResult> {
  try {
    const result = await call('frappe.desk.form.load.getdoctype', {
      doctype,
      with_parent: withParent ? 1 : 0
    })

    // Response structure from getdoctype:
    // - result.docs: Array of DocType metas (main + child tables)
    // - result.user_settings: User-specific settings (JSON string from __UserSettings.data)
    const docs = result.docs || result.message?.docs || []
    const meta = docs[0] // First doc is the main DocType
    const rawUserSettings = result.user_settings || result.message?.user_settings
    
    // Parse user_settings (Frappe returns JSON string from __UserSettings.data)
    const userSettings = parseUserSettings(rawUserSettings)

    return {
      success: true,
      meta,
      docs,
      user_settings: userSettings
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Get document info (attachments, comments, etc.) for an existing document
 * 
 * @param doctype - DocType name
 * @param name - Document name
 */
export async function getDocInfo(
  doctype: string,
  name: string
): Promise<{ success: boolean; docinfo?: any; error?: FrappeError }> {
  try {
    const result = await call('frappe.desk.form.load.get_docinfo', {
      doctype,
      name
    })

    return {
      success: true,
      docinfo: result.docinfo || result.message?.docinfo || result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

// ============================================================================
// Document Utilities
// ============================================================================

/**
 * Run a method on a document
 * 
 * @param doctype - DocType name
 * @param name - Document name
 * @param method - Method name to call
 * @param args - Additional arguments
 */
export async function runDocMethod(
  doctype: string,
  name: string,
  method: string,
  args?: Record<string, any>
): Promise<{ success: boolean; message?: any; error?: FrappeError }> {
  try {
    const result = await call('frappe.client.run_doc_method', {
      dt: doctype,
      dn: name,
      method,
      args: args ? JSON.stringify(args) : undefined
    })

    return {
      success: true,
      message: result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Get a new document with default values
 * 
 * Uses our custom API wrapper around frappe.new_doc() because:
 * - frappe.client.get_new doesn't exist (not whitelisted)
 * - frappe.model.get_new_doc() is client-side JS only (runs in Frappe context)
 * - Our wrapper provides the same functionality via API
 * 
 * @param doctype - DocType name
 * @param withMandatoryChildren - Create empty rows for required child tables
 */
export async function getNewDoc(
  doctype: string,
  withMandatoryChildren: boolean = false
): Promise<any> {
  const result = await call('axon_erp.api.get_new_doc', {
    doctype,
    with_mandatory_children: withMandatoryChildren ? 1 : 0
  })

  return result.message || result
}

/**
 * Check if a value exists (for Link validation)
 * 
 * @param doctype - DocType to check in
 * @param fieldname - Field to match (default: 'name')
 * @param value - Value to check
 */
export async function exists(
  doctype: string,
  value: string,
  fieldname: string = 'name'
): Promise<boolean> {
  try {
    const result = await call('frappe.client.exists', {
      doctype,
      [fieldname]: value
    })
    return !!result.message
  } catch {
    return false
  }
}

/**
 * Get a single value from a document
 * 
 * @param doctype - DocType name
 * @param name - Document name
 * @param fieldname - Field to get
 */
export async function getValue(
  doctype: string,
  name: string,
  fieldname: string
): Promise<any> {
  try {
    const result = await call('frappe.client.get_value', {
      doctype,
      filters: { name },
      fieldname
    })
    return result.message?.[fieldname]
  } catch {
    return null
  }
}

/**
 * Set a single value on a document
 * 
 * @param doctype - DocType name
 * @param name - Document name
 * @param fieldname - Field to set
 * @param value - Value to set
 */
export async function setValue(
  doctype: string,
  name: string,
  fieldname: string,
  value: any
): Promise<{ success: boolean; error?: FrappeError }> {
  try {
    await call('frappe.client.set_value', {
      doctype,
      name,
      fieldname,
      value
    })
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

// ============================================================================
// Desk Parity APIs - Client Lifecycle Verbs
// ============================================================================

/**
 * Insert a document using frappe.client.insert
 * 
 * Used by Desk for quick entry and dialog-based creates
 * Based on: frappe/client.py::insert() and frappe/public/js/frappe/db.js::insert()
 * 
 * @param doc - Document to insert (must have doctype)
 */
export async function clientInsert(doc: Record<string, any>): Promise<DocumentSaveResult> {
  try {
    const result = await call('frappe.client.insert', {
      doc: JSON.stringify(doc)
    })
    
    return {
      success: true,
      doc: result.message,
      message: 'Inserted'
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Save a document using frappe.client.save
 * 
 * Used by Desk for quick entry saves (not full form saves - those use savedocs)
 * Based on: frappe/client.py::save() and frappe/public/js/frappe/form/quick_entry.js::insert()
 * 
 * @param doc - Document to save (must have doctype and name)
 */
export async function clientSave(doc: Record<string, any>): Promise<DocumentSaveResult> {
  try {
    const result = await call('frappe.client.save', {
      doc: JSON.stringify(doc)
    })
    
    return {
      success: true,
      doc: result.message,
      message: 'Saved'
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Submit a document using frappe.client.submit
 * 
 * Used by Desk for quick entry submits
 * Based on: frappe/client.py::submit() and frappe/public/js/frappe/form/quick_entry.js::submit()
 * 
 * @param doc - Document to submit (must have doctype and name)
 */
export async function clientSubmit(doc: Record<string, any>): Promise<DocumentSaveResult> {
  try {
    const result = await call('frappe.client.submit', {
      doc: JSON.stringify(doc)
    })
    
    return {
      success: true,
      doc: result.message,
      message: 'Submitted'
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Cancel a document using frappe.client.cancel
 * 
 * Generic client cancel (use cancelDocument/savedocs for full form flow)
 * Based on: frappe/client.py::cancel()
 * 
 * @param doctype - DocType name
 * @param name - Document name
 */
export async function clientCancel(doctype: string, name: string): Promise<DocumentSaveResult> {
  try {
    const result = await call('frappe.client.cancel', {
      doctype,
      name
    })
    
    return {
      success: true,
      doc: result.message,
      message: 'Cancelled'
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Validate a link field and optionally fetch dependent fields
 * 
 * Used by Desk link fields to validate existence and populate fetch fields
 * Based on: frappe/client.py::validate_link() and 
 * frappe/public/js/frappe/form/controls/link.js::validate_link_and_fetch()
 * 
 * @param doctype - The linked DocType
 * @param docname - The document name to validate
 * @param fields - Optional array of fields to fetch from the linked doc
 * @returns The validated doc with fetched fields
 */
export async function validateLink(
  doctype: string,
  docname: string,
  fields?: string[]
): Promise<{ success: boolean; doc?: any; error?: FrappeError }> {
  try {
    const result = await call('frappe.client.validate_link', {
      doctype,
      docname,
      fields: fields ? JSON.stringify(fields) : undefined
    })
    
    return {
      success: true,
      doc: result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Check if a document has been amended
 * 
 * Used by Desk to gate the Amend action (prevent double-amend)
 * Based on: frappe/client.py::is_document_amended() and 
 * frappe/public/js/frappe/form/toolbar.js and form.js amend_doc() checks
 * 
 * @param doctype - DocType name
 * @param docname - Document name
 * @returns true if the document has already been amended
 */
export async function isDocumentAmended(
  doctype: string,
  docname: string
): Promise<boolean> {
  try {
    const result = await call('frappe.client.is_document_amended', {
      doctype,
      docname
    })
    
    return !!result.message
  } catch (error) {
    console.error('[isDocumentAmended] Error checking amend status:', error)
    return false
  }
}

/**
 * Get a single value from a Single DocType
 * 
 * Used for reading settings/configuration values
 * Based on: frappe/client.py::get_single_value() and frappe/public/js/frappe/db.js::get_single_value()
 * 
 * @param doctype - Single DocType name
 * @param field - Field name to get
 */
export async function getSingleValue(doctype: string, field: string): Promise<any> {
  try {
    const result = await call('frappe.client.get_single_value', {
      doctype,
      field
    })
    
    return result.message
  } catch (error) {
    console.error('[getSingleValue] Error fetching single value:', error)
    return null
  }
}

/**
 * Rename a document (including merge option)
 * 
 * Uses Desk's rename flow (not frappe.client.rename_doc, which Desk doesn't use)
 * Based on: frappe/model/rename_doc.py::update_document_title() and 
 * frappe/public/js/frappe/form/toolbar.js::rename_document_title()
 * 
 * @param doctype - DocType name
 * @param docname - Current document name
 * @param newName - New name (can be same as old if only updating title)
 * @param newTitle - New title (for title_field updates)
 * @param merge - Whether to merge with existing doc if newName exists
 * @param enqueue - Run in background (for large renames with many links)
 */
export async function updateDocumentTitle(params: {
  doctype: string
  docname: string
  name?: string
  title?: string
  merge?: boolean
  enqueue?: boolean
}): Promise<{ success: boolean; new_name?: string; error?: FrappeError }> {
  try {
    const result = await call('frappe.model.rename_doc.update_document_title', {
      doctype: params.doctype,
      docname: params.docname,
      name: params.name,
      title: params.title,
      merge: params.merge ? 1 : 0,
      enqueue: params.enqueue ? 1 : 0
    })
    
    return {
      success: true,
      new_name: result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

