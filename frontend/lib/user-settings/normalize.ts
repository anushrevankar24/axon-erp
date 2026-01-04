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
  
  // Top-level last_view (DESK PARITY)
  if (typeof settings.last_view === 'string') {
    sanitized.last_view = settings.last_view
  }
  
  // Form settings (NOTE: Form collapse/tab typically NOT in __UserSettings for Desk)
  if (settings.Form && typeof settings.Form === 'object') {
    sanitized.Form = {
      collapsed_sections: normalizeCollapsedSections(settings.Form.collapsed_sections),
      active_tab: typeof settings.Form.active_tab === 'string' ? settings.Form.active_tab : undefined
    }
  }
  
  // GridView settings (DESK PARITY: matches exactly)
  if (settings.GridView && typeof settings.GridView === 'object') {
    sanitized.GridView = {}
    for (const [childDoctype, columns] of Object.entries(settings.GridView)) {
      if (Array.isArray(columns)) {
        sanitized.GridView[childDoctype] = normalizeGridColumns(columns)
      }
    }
  }
  
  // List settings (DESK PARITY: sort_by/sort_order, NOT order_by)
  if (settings.List && typeof settings.List === 'object') {
    sanitized.List = {
      filters: normalizeListFilters(settings.List.filters),
      sort_by: typeof settings.List.sort_by === 'string' ? settings.List.sort_by : undefined,
      sort_order: typeof settings.List.sort_order === 'string' ? settings.List.sort_order : undefined,
      fields: Array.isArray(settings.List.fields) ? settings.List.fields : undefined,
      // Backwards compat: parse old order_by if present
      ...(settings.List.order_by && !settings.List.sort_by ? parseOrderBy(settings.List.order_by) : {})
    }
  }
  
  // Kanban settings (DESK PARITY: only last_kanban_board)
  if (settings.Kanban && typeof settings.Kanban === 'object') {
    sanitized.Kanban = {
      last_kanban_board: typeof settings.Kanban.last_kanban_board === 'string' ? settings.Kanban.last_kanban_board : undefined,
      // Keep deprecated fields for backwards compat
      filters: normalizeListFilters(settings.Kanban.filters),
      kanban_column_field: settings.Kanban.kanban_column_field,
      kanban_fields: Array.isArray(settings.Kanban.kanban_fields) ? settings.Kanban.kanban_fields : undefined
    }
  }
  
  // Calendar settings (DESK PARITY: only last_calendar)
  if (settings.Calendar && typeof settings.Calendar === 'object') {
    sanitized.Calendar = {
      last_calendar: typeof settings.Calendar.last_calendar === 'string' ? settings.Calendar.last_calendar : undefined,
      // Keep deprecated fields for backwards compat
      filters: normalizeListFilters(settings.Calendar.filters),
      start_date_field: settings.Calendar.start_date_field,
      end_date_field: settings.Calendar.end_date_field,
      group_by_field: settings.Calendar.group_by_field
    }
  }
  
  // Gantt settings (DESK PARITY: gantt_view_mode + sort fields)
  if (settings.Gantt && typeof settings.Gantt === 'object') {
    sanitized.Gantt = {
      gantt_view_mode: typeof settings.Gantt.gantt_view_mode === 'string' ? settings.Gantt.gantt_view_mode : undefined,
      sort_by: typeof settings.Gantt.sort_by === 'string' ? settings.Gantt.sort_by : undefined,
      sort_order: typeof settings.Gantt.sort_order === 'string' ? settings.Gantt.sort_order : undefined,
      // Keep deprecated fields for backwards compat
      filters: normalizeListFilters(settings.Gantt.filters),
      start_date_field: settings.Gantt.start_date_field,
      end_date_field: settings.Gantt.end_date_field
    }
  }
  
  // Image settings (keep as-is, less critical)
  if (settings.Image && typeof settings.Image === 'object') {
    sanitized.Image = {
      filters: normalizeListFilters(settings.Image.filters),
      image_field: settings.Image.image_field,
      title_field: settings.Image.title_field
    }
  }
  
  // Inbox settings (DESK PARITY: last_email_account + sort fields)
  if (settings.Inbox && typeof settings.Inbox === 'object') {
    sanitized.Inbox = {
      last_email_account: typeof settings.Inbox.last_email_account === 'string' ? settings.Inbox.last_email_account : undefined,
      sort_by: typeof settings.Inbox.sort_by === 'string' ? settings.Inbox.sort_by : undefined,
      sort_order: typeof settings.Inbox.sort_order === 'string' ? settings.Inbox.sort_order : undefined,
      // Keep deprecated fields for backwards compat
      filters: normalizeListFilters(settings.Inbox.filters),
      inbox_view: settings.Inbox.inbox_view
    }
  }
  
  // Report settings (keep as-is pending audit)
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
 * Parse old order_by format into sort_by/sort_order (backwards compat)
 * Example: "modified desc" -> {sort_by: "modified", sort_order: "desc"}
 */
function parseOrderBy(orderBy: string): { sort_by: string; sort_order: string } {
  const parts = orderBy.trim().split(/\s+/)
  return {
    sort_by: parts[0] || 'modified',
    sort_order: (parts[1]?.toLowerCase() === 'asc' ? 'asc' : 'desc')
  }
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


