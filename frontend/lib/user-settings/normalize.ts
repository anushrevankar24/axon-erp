/**
 * User Settings Normalization
 * 
 * Defensive parsing and normalization for user_settings from Frappe backend.
 * Handles:
 * - JSON string vs object (Frappe sometimes returns JSON string)
 * - Missing/null values
 * - Corrupted data (Desk has seen edge cases with corrupt settings)
 * - Version compatibility (old settings format)
 */

import type { UserSettings, ListFilter, GridColumnSetting } from './schema'

/**
 * Parse user_settings from Frappe response
 * 
 * Frappe can return:
 * - JSON string: '{"Form": {...}}'
 * - Object: {Form: {...}}
 * - Empty string: ''
 * - null/undefined
 * 
 * @param raw - Raw response from frappe.model.utils.user_settings.get or getdoctype
 */
export function parseUserSettings(raw: any): UserSettings {
  if (!raw) return {}
  
  // If already an object, return as-is
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return sanitizeUserSettings(raw)
  }
  
  // If string, try to parse
  if (typeof raw === 'string') {
    if (raw.trim() === '') return {}
    
    try {
      const parsed = JSON.parse(raw)
      return sanitizeUserSettings(parsed)
    } catch (error) {
      console.error('[parseUserSettings] Failed to parse JSON:', error)
      return {}
    }
  }
  
  return {}
}

/**
 * Sanitize parsed user_settings
 * Removes corrupt data, normalizes types
 */
function sanitizeUserSettings(settings: any): UserSettings {
  if (!settings || typeof settings !== 'object') return {}
  
  const sanitized: UserSettings = {}
  
  // Form settings
  if (settings.Form && typeof settings.Form === 'object') {
    sanitized.Form = {
      collapsed_sections: normalizeCollapsedSections(settings.Form.collapsed_sections),
      active_tab: typeof settings.Form.active_tab === 'string' ? settings.Form.active_tab : undefined
    }
  }
  
  // GridView settings
  if (settings.GridView && typeof settings.GridView === 'object') {
    sanitized.GridView = {}
    for (const [childDoctype, columns] of Object.entries(settings.GridView)) {
      if (Array.isArray(columns)) {
        sanitized.GridView[childDoctype] = normalizeGridColumns(columns)
      }
    }
  }
  
  // List settings
  if (settings.List && typeof settings.List === 'object') {
    sanitized.List = {
      filters: normalizeListFilters(settings.List.filters),
      order_by: typeof settings.List.order_by === 'string' ? settings.List.order_by : undefined,
      fields: Array.isArray(settings.List.fields) ? settings.List.fields : undefined,
      page_length: typeof settings.List.page_length === 'number' ? settings.List.page_length : undefined,
      last_view: typeof settings.List.last_view === 'string' ? settings.List.last_view : undefined
    }
  }
  
  // Kanban settings
  if (settings.Kanban && typeof settings.Kanban === 'object') {
    sanitized.Kanban = {
      filters: normalizeListFilters(settings.Kanban.filters),
      kanban_column_field: settings.Kanban.kanban_column_field,
      kanban_fields: Array.isArray(settings.Kanban.kanban_fields) ? settings.Kanban.kanban_fields : undefined
    }
  }
  
  // Calendar settings
  if (settings.Calendar && typeof settings.Calendar === 'object') {
    sanitized.Calendar = {
      filters: normalizeListFilters(settings.Calendar.filters),
      start_date_field: settings.Calendar.start_date_field,
      end_date_field: settings.Calendar.end_date_field,
      group_by_field: settings.Calendar.group_by_field
    }
  }
  
  // Gantt settings
  if (settings.Gantt && typeof settings.Gantt === 'object') {
    sanitized.Gantt = {
      filters: normalizeListFilters(settings.Gantt.filters),
      start_date_field: settings.Gantt.start_date_field,
      end_date_field: settings.Gantt.end_date_field,
      view_mode: settings.Gantt.view_mode
    }
  }
  
  // Image settings
  if (settings.Image && typeof settings.Image === 'object') {
    sanitized.Image = {
      filters: normalizeListFilters(settings.Image.filters),
      image_field: settings.Image.image_field,
      title_field: settings.Image.title_field
    }
  }
  
  // Inbox settings
  if (settings.Inbox && typeof settings.Inbox === 'object') {
    sanitized.Inbox = {
      filters: normalizeListFilters(settings.Inbox.filters),
      inbox_view: settings.Inbox.inbox_view
    }
  }
  
  // Report settings
  if (settings.Report && typeof settings.Report === 'object') {
    sanitized.Report = {
      filters: settings.Report.filters,
      saved_filters: settings.Report.saved_filters,
      chart_settings: settings.Report.chart_settings
    }
  }
  
  return sanitized
}

/**
 * Normalize collapsed sections
 * Handles cases where Desk may have stored strings or numbers instead of booleans
 */
function normalizeCollapsedSections(value: any): Record<string, boolean> | undefined {
  if (!value || typeof value !== 'object') return undefined
  
  const normalized: Record<string, boolean> = {}
  for (const [key, val] of Object.entries(value)) {
    // Convert to boolean (Desk sometimes stores 1/0)
    normalized[key] = !!val
  }
  
  return Object.keys(normalized).length > 0 ? normalized : undefined
}

/**
 * Normalize grid column settings
 * Ensures each entry has fieldname and columns (width)
 */
function normalizeGridColumns(columns: any[]): GridColumnSetting[] {
  return columns
    .filter(col => col && typeof col === 'object' && col.fieldname)
    .map(col => ({
      fieldname: col.fieldname,
      columns: typeof col.columns === 'number' ? col.columns : 2
    }))
}

/**
 * Normalize list filters
 * Desk filter format: [doctype, fieldname, operator, value]
 */
function normalizeListFilters(filters: any): ListFilter[] | undefined {
  if (!Array.isArray(filters)) return undefined
  
  return filters
    .filter(f => Array.isArray(f) && f.length >= 4)
    .map(f => [f[0], f[1], f[2], f[3]] as ListFilter)
}

/**
 * Serialize user_settings for Frappe API
 * 
 * Frappe expects JSON string for user_settings.save
 * 
 * @param settings - UserSettings object
 * @returns JSON string
 */
export function serializeUserSettings(settings: UserSettings): string {
  return JSON.stringify(settings)
}

/**
 * Check if user_settings are empty
 */
export function isEmptySettings(settings: UserSettings): boolean {
  if (!settings || typeof settings !== 'object') return true
  return Object.keys(settings).length === 0
}


