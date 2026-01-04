/**
 * User Settings Helper Functions
 * 
 * Convenience wrappers for common user_settings operations
 */

import { saveUserSettings } from './service'
import type { GridColumnSetting, ListFilter } from './schema'

/**
 * Save collapsed sections state
 * 
 * @param doctype - Parent DocType name
 * @param collapsedSections - Map of section fieldname → collapsed state
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
 * Save active tab
 * 
 * @param doctype - DocType name
 * @param activeTab - Tab fieldname
 */
export async function saveActiveTab(
  doctype: string,
  activeTab: string
): Promise<void> {
  await saveUserSettings(doctype, {
    Form: {
      active_tab: activeTab
    }
  })
}

/**
 * Save grid column preferences
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
  await saveUserSettings(parentDoctype, {
    GridView: {
      [childDoctype]: columns
    }
  })
}

/**
 * Save list view filters
 * 
 * @param doctype - DocType name
 * @param filters - Array of Desk-format filters
 */
export async function saveListFilters(
  doctype: string,
  filters: ListFilter[]
): Promise<void> {
  await saveUserSettings(doctype, {
    List: {
      filters
    }
  })
}

/**
 * Save list view sorting
 * 
 * @param doctype - DocType name
 * @param orderBy - Sort string (e.g., "modified desc")
 */
export async function saveListSort(
  doctype: string,
  orderBy: string
): Promise<void> {
  await saveUserSettings(doctype, {
    List: {
      order_by: orderBy
    }
  })
}

/**
 * Save list view columns
 * 
 * @param doctype - DocType name
 * @param fields - Array of field names to show
 */
export async function saveListColumns(
  doctype: string,
  fields: string[]
): Promise<void> {
  await saveUserSettings(doctype, {
    List: {
      fields
    }
  })
}

/**
 * Save list view page length
 * 
 * @param doctype - DocType name
 * @param pageLength - Number of items per page
 */
export async function saveListPageLength(
  doctype: string,
  pageLength: number
): Promise<void> {
  await saveUserSettings(doctype, {
    List: {
      page_length: pageLength
    }
  })
}

/**
 * Save Kanban column field
 * 
 * @param doctype - DocType name
 * @param fieldname - Field to use for kanban columns
 */
export async function saveKanbanColumnField(
  doctype: string,
  fieldname: string
): Promise<void> {
  await saveUserSettings(doctype, {
    Kanban: {
      kanban_column_field: fieldname
    }
  })
}

/**
 * Save Calendar date fields
 * 
 * @param doctype - DocType name
 * @param startField - Field for event start date
 * @param endField - Field for event end date (optional)
 */
export async function saveCalendarFields(
  doctype: string,
  startField: string,
  endField?: string
): Promise<void> {
  await saveUserSettings(doctype, {
    Calendar: {
      start_date_field: startField,
      end_date_field: endField
    }
  })
}


