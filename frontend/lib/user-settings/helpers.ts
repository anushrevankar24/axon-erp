/**
 * User Settings Helper Functions (Desk-style)
 * 
 * Convenience wrappers that use the Desk save signature: save(doctype, key, value)
 */

import { saveUserSettings } from './service'
import type { GridColumnSetting, ListFilter } from './schema'

/**
 * Save collapsed sections state
 * NOTE: Per Desk parity plan, collapsible sections use localStorage, not __UserSettings.
 * This helper is kept for backwards compatibility but should not be used for Desk parity.
 * 
 * @param doctype - Parent DocType name
 * @param collapsedSections - Map of section fieldname → collapsed state
 * @deprecated Use localStorage directly for Desk parity
 */
export async function saveCollapsedSections(
  doctype: string,
  collapsedSections: Record<string, boolean>
): Promise<void> {
  await saveUserSettings(doctype, 'Form', {
    collapsed_sections: collapsedSections
  })
}

/**
 * Save active tab
 * NOTE: Per Desk parity plan, active tab uses in-memory map, not __UserSettings.
 * This helper is kept for backwards compatibility but should not be used for Desk parity.
 * 
 * @param doctype - DocType name
 * @param activeTab - Tab fieldname
 * @deprecated Use in-memory map directly for Desk parity
 */
export async function saveActiveTab(
  doctype: string,
  activeTab: string
): Promise<void> {
  await saveUserSettings(doctype, 'Form', {
    active_tab: activeTab
  })
}

/**
 * Save grid column preferences (Desk-style)
 * 
 * @param parentDoctype - Parent DocType (e.g., "Item")
 * @param childDoctype - Child table DocType (e.g., "Item Default")
 * @param columns - Array of column settings with fieldname and width
 */
export async function saveGridColumns(
  parentDoctype: string,
  childDoctype: string,
  columns: GridColumnSetting[]
): Promise<void> {
  await saveUserSettings(parentDoctype, 'GridView', {
    [childDoctype]: columns
  })
}

/**
 * Save list view filters (Desk-style)
 * 
 * @param doctype - DocType name
 * @param filters - Array of Desk-format filters
 */
export async function saveListFilters(
  doctype: string,
  filters: ListFilter[]
): Promise<void> {
  await saveUserSettings(doctype, 'List', { filters })
}

/**
 * Save list view sorting (DESK PARITY: separate sort_by and sort_order)
 * 
 * @param doctype - DocType name
 * @param sortBy - Field name to sort by (e.g., "modified", "creation")
 * @param sortOrder - Sort direction ("asc" or "desc")
 */
export async function saveListSort(
  doctype: string,
  sortBy: string,
  sortOrder: string
): Promise<void> {
  await saveUserSettings(doctype, 'List', { sort_by: sortBy, sort_order: sortOrder })
}

/**
 * Save list view columns (Desk-style)
 * 
 * @param doctype - DocType name
 * @param fields - Array of field names to show
 */
export async function saveListColumns(
  doctype: string,
  fields: string[]
): Promise<void> {
  await saveUserSettings(doctype, 'List', { fields })
}

/**
 * Save list view page length
 * 
 * DESK PARITY NOTE: Desk does NOT persist page_length via user_settings.
 * It sets it at runtime: frappe.is_large_screen() ? 100 : 20
 * 
 * This helper is kept for backwards compatibility but should NOT be used for Desk parity.
 * 
 * @param doctype - DocType name
 * @param pageLength - Number of items per page
 * @deprecated Not persisted in Desk; runtime only
 */
export async function saveListPageLength(
  doctype: string,
  pageLength: number
): Promise<void> {
  // For Desk parity, do nothing
  // If you want to persist anyway (non-parity), uncomment:
  // await saveUserSettings(doctype, 'List', { page_length: pageLength })
}

/**
 * Save top-level last_view (DESK PARITY)
 * 
 * @param doctype - DocType name
 * @param viewName - View name (e.g., "List", "Kanban", "Calendar")
 */
export async function saveLastView(
  doctype: string,
  viewName: string
): Promise<void> {
  await saveUserSettings(doctype, 'last_view', viewName)
}

/**
 * Save last Kanban board (DESK PARITY)
 * 
 * @param doctype - DocType name
 * @param boardName - Kanban Board name
 */
export async function saveLastKanbanBoard(
  doctype: string,
  boardName: string
): Promise<void> {
  await saveUserSettings(doctype, 'Kanban', { last_kanban_board: boardName })
}

/**
 * Save Kanban column field
 * 
 * DESK PARITY NOTE: Column field is defined in Kanban Board doctype, not user_settings.
 * This helper is deprecated for Desk parity.
 * 
 * @deprecated Use Kanban Board doctype for Desk parity
 */
export async function saveKanbanColumnField(
  doctype: string,
  fieldname: string
): Promise<void> {
  // For Desk parity, this should update Kanban Board doc, not user_settings
  await saveUserSettings(doctype, 'Kanban', { kanban_column_field: fieldname })
}

/**
 * Save last Calendar (DESK PARITY)
 * 
 * @param doctype - DocType name
 * @param calendarName - Calendar name (e.g., "default" or Calendar View doc name)
 */
export async function saveLastCalendar(
  doctype: string,
  calendarName: string
): Promise<void> {
  await saveUserSettings(doctype, 'Calendar', { last_calendar: calendarName })
}

/**
 * Save Calendar date fields
 * 
 * DESK PARITY NOTE: Date fields are defined in Calendar View doctype, not user_settings.
 * This helper is deprecated for Desk parity.
 * 
 * @deprecated Use Calendar View doctype for Desk parity
 */
export async function saveCalendarFields(
  doctype: string,
  startField: string,
  endField?: string
): Promise<void> {
  // For Desk parity, this should be in Calendar View doc, not user_settings
  await saveUserSettings(doctype, 'Calendar', {
    start_date_field: startField,
    end_date_field: endField
  })
}


