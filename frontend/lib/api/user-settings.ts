/**
 * User Settings API
 * 
 * Manages per-user, per-doctype settings like:
 * - Collapsed sections
 * - Grid column preferences
 * - List view filters
 * 
 * Uses official Frappe API: frappe.model.utils.user_settings
 */

import { call } from './client'

/**
 * Save user settings for a DocType
 * 
 * @param doctype - DocType name
 * @param settings - Settings object to save (will be merged with existing)
 * 
 * Official API: frappe.model.utils.user_settings.save
 */
export async function saveUserSettings(
  doctype: string,
  settings: Record<string, any>
): Promise<{ success: boolean; error?: any }> {
  try {
    await call('frappe.model.utils.user_settings.save', {
      doctype,
      user_settings: JSON.stringify(settings)
    })
    return { success: true }
  } catch (error: any) {
    console.error('[saveUserSettings] Error:', error)
    return { success: false, error }
  }
}

/**
 * Get user settings for a DocType
 * 
 * @param doctype - DocType name
 * 
 * Official API: frappe.model.utils.user_settings.get
 */
export async function getUserSettings(
  doctype: string
): Promise<Record<string, any>> {
  try {
    const result = await call('frappe.model.utils.user_settings.get', {
      doctype
    })
    
    // Parse JSON string response
    const settings = typeof result.message === 'string' 
      ? JSON.parse(result.message || '{}')
      : result.message || {}
    
    return settings
  } catch (error: any) {
    console.error('[getUserSettings] Error:', error)
    return {}
  }
}

/**
 * Save collapsed sections state
 * 
 * @param doctype - DocType name
 * @param collapsedSections - Object mapping section fieldnames to collapsed state
 */
export async function saveCollapsedSections(
  doctype: string,
  collapsedSections: Record<string, boolean>
): Promise<void> {
  await saveUserSettings(doctype, {
    Form: {
      collapsed_sections: collapsedSections
    }
  })
}

/**
 * Save grid column preferences
 * 
 * @param parentDoctype - Parent DocType (e.g., "Item")
 * @param childDoctype - Child table DocType (e.g., "Item Default")
 * @param columns - Array of column definitions with fieldname and width
 */
export async function saveGridColumns(
  parentDoctype: string,
  childDoctype: string,
  columns: Array<{ fieldname: string; columns: number }>
): Promise<void> {
  await saveUserSettings(parentDoctype, {
    GridView: {
      [childDoctype]: columns
    }
  })
}

