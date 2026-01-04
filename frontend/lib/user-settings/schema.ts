/**
 * ERPNext Desk user_settings Schema
 * 
 * Type definitions matching the structure stored in Frappe's __UserSettings
 * Source of truth: frappe/model/utils/user_settings.py + Desk client JS
 * 
 * Storage format:
 * {
 *   "Form": { collapsed_sections: {...}, active_tab: "..." },
 *   "GridView": { "Child DocType": [{ fieldname, columns }, ...] },
 *   "List": { filters: [...], order_by: "...", ... },
 *   "Kanban": { ... },
 *   "Calendar": { ... },
 *   "Gantt": { ... },
 *   "Image": { ... },
 *   "Inbox": { ... },
 *   "Report": { ... }
 * }
 */

// ============================================================================
// Form View Settings
// ============================================================================

export interface FormSettings {
  /**
   * DESK PARITY NOTE: Collapsed sections are NOT stored in __UserSettings in standard Desk.
   * They are stored in localStorage using df.css_class + "-closed" key.
   * This interface field is kept for compatibility with extended/custom implementations.
   * 
   * @deprecated Use localStorage with css_class key for Desk parity
   */
  collapsed_sections?: Record<string, boolean>
  
  /**
   * DESK PARITY NOTE: Active tab is NOT stored in __UserSettings in standard Desk.
   * It is kept in-memory via active_tab_map[docname].
   * This interface field is kept for compatibility with extended/custom implementations.
   * 
   * @deprecated Use in-memory map for Desk parity
   */
  active_tab?: string
}

// ============================================================================
// Grid View Settings (Child Tables)
// ============================================================================

export interface GridColumnSetting {
  /**
   * Field name
   */
  fieldname: string
  
  /**
   * Column width (Desk uses "columns" as the key, not "width")
   * Default: 2 (matches Desk default colsize)
   */
  columns: number
}

export interface GridViewSettings {
  /**
   * Grid column preferences per child table DocType
   * Key: child table DocType name (e.g., "Item Default")
   * Value: array of column settings
   * 
   * Desk source: frappe/public/js/frappe/form/grid.js: setup_user_defined_columns()
   */
  [childDoctype: string]: GridColumnSetting[]
}

// ============================================================================
// List View Settings
// ============================================================================

export interface ListFilter {
  /**
   * Standard Desk filter format: [doctype, fieldname, operator, value]
   * Index mapping from user_settings.py: {"doctype": 0, "docfield": 1, "operator": 2, "value": 3}
   */
  0: string  // doctype
  1: string  // fieldname
  2: string  // operator (e.g., "=", "like", "in")
  3: any     // value
}

export interface ListSettings {
  /**
   * Saved filters (Desk format: array of 4-element tuples)
   * Desk source: frappe/public/js/frappe/list/list_view.js:618
   */
  filters?: ListFilter[]
  
  /**
   * Sort field name (DESK PARITY: separate from sort_order)
   * Desk source: frappe/public/js/frappe/list/list_view.js:619
   * Example: "modified", "creation", "item_name"
   */
  sort_by?: string
  
  /**
   * Sort direction (DESK PARITY: "asc" or "desc")
   * Desk source: frappe/public/js/frappe/list/list_view.js:620
   */
  sort_order?: string
  
  /**
   * Visible columns/fields
   * Desk source: frappe/public/js/frappe/list/list_view.js (less common)
   */
  fields?: string[]
  
  /**
   * DESK PARITY NOTE: page_length is NOT persisted via user_settings in Desk.
   * Desk sets it at runtime: frappe.is_large_screen() ? 100 : 20
   * 
   * @deprecated Do not use for Desk parity
   */
  page_length?: number
}

// ============================================================================
// Kanban View Settings
// ============================================================================

export interface KanbanSettings {
  /**
   * Last viewed Kanban Board name (DESK PARITY)
   * Desk source: frappe/public/js/frappe/views/kanban/kanban_view.js:171-173
   * 
   * DESK PARITY NOTE: Filters and fields are stored in the Kanban Board doctype,
   * NOT in __UserSettings. Only the board name is stored here.
   */
  last_kanban_board?: string
  
  /**
   * @deprecated Filters are stored in Kanban Board doctype for Desk parity
   */
  filters?: ListFilter[]
  
  /**
   * @deprecated Column field is defined in Kanban Board doctype for Desk parity
   */
  kanban_column_field?: string
  
  /**
   * @deprecated Fields are stored in Kanban Board doctype for Desk parity
   */
  kanban_fields?: string[]
}

// ============================================================================
// Calendar View Settings
// ============================================================================

export interface CalendarSettings {
  /**
   * Last viewed Calendar name (DESK PARITY)
   * Desk source: frappe/public/js/frappe/views/calendar/calendar.js:45-47
   * 
   * DESK PARITY NOTE: 
   * - UI prefs (defaultView, weekends) are stored in localStorage (cal_defaultView, cal_weekends)
   * - Field mappings come from Calendar View doctype or default calendar config
   * - NOT stored in __UserSettings
   */
  last_calendar?: string
  
  /**
   * @deprecated Date fields are defined in Calendar View doctype for Desk parity
   */
  start_date_field?: string
  
  /**
   * @deprecated Date fields are defined in Calendar View doctype for Desk parity
   */
  end_date_field?: string
  
  /**
   * @deprecated Group-by is defined in Calendar View doctype for Desk parity
   */
  group_by_field?: string
  
  /**
   * @deprecated Filters managed by Calendar View doctype for Desk parity
   */
  filters?: ListFilter[]
}

// ============================================================================
// Gantt View Settings
// ============================================================================

export interface GanttSettings {
  /**
   * Gantt view mode (DESK PARITY)
   * Desk source: frappe/public/js/frappe/views/gantt/gantt_view.js:91,135-137
   * Values: "Day", "Week", "Month", "Year", "Half Day", "Quarter Day"
   */
  gantt_view_mode?: string
  
  /**
   * Sort field (DESK PARITY: inherited from ListView)
   * Desk source: frappe/public/js/frappe/views/gantt/gantt_view.js:22
   */
  sort_by?: string
  
  /**
   * Sort order (DESK PARITY: inherited from ListView)
   * Desk source: frappe/public/js/frappe/views/gantt/gantt_view.js:23
   */
  sort_order?: string
  
  /**
   * @deprecated Date fields are defined in calendar_settings or meta for Desk parity
   */
  start_date_field?: string
  
  /**
   * @deprecated Date fields are defined in calendar_settings or meta for Desk parity
   */
  end_date_field?: string
  
  /**
   * @deprecated Filters managed by view for Desk parity
   */
  filters?: ListFilter[]
}

// ============================================================================
// Image View Settings
// ============================================================================

export interface ImageSettings {
  /**
   * Image gallery view settings
   * Desk source: frappe/public/js/frappe/views/image/image_view.js
   */
  filters?: ListFilter[]
  
  /**
   * Field to use for image
   */
  image_field?: string
  
  /**
   * Fields to show in image card overlay
   */
  title_field?: string
}

// ============================================================================
// Inbox View Settings
// ============================================================================

export interface InboxSettings {
  /**
   * Last viewed email account (DESK PARITY)
   * Desk source: frappe/public/js/frappe/views/inbox/inbox_view.js:40-42
   */
  last_email_account?: string
  
  /**
   * Sort field (DESK PARITY: inherited from ListView)
   * Desk source: frappe/public/js/frappe/views/inbox/inbox_view.js:49
   */
  sort_by?: string
  
  /**
   * Sort order (DESK PARITY: inherited from ListView)
   * Desk source: frappe/public/js/frappe/views/inbox/inbox_view.js:50
   */
  sort_order?: string
  
  /**
   * @deprecated Filters are route-driven in Desk Inbox
   */
  filters?: ListFilter[]
  
  /**
   * @deprecated View mode not persisted in standard Desk
   */
  inbox_view?: string
}

// ============================================================================
// Report View Settings
// ============================================================================

export interface ReportSettings {
  /**
   * Query Report and standard report settings
   * Desk source: frappe/public/js/frappe/views/reports/*
   */
  filters?: Record<string, any>
  
  /**
   * Saved filter presets
   */
  saved_filters?: Array<{
    name: string
    filters: Record<string, any>
  }>
  
  /**
   * Chart settings for reports with charts
   */
  chart_settings?: {
    chart_type?: string
    group_by?: string
  }
}

// ============================================================================
// Top-Level User Settings
// ============================================================================

/**
 * Complete user_settings structure as stored in Frappe __UserSettings
 * 
 * This matches the structure Desk reads/writes via:
 * - frappe.model.utils.user_settings.get(doctype)
 * - frappe.model.utils.user_settings.save(doctype, settings)
 * 
 * Each DocType can have settings for different view types.
 */
export interface UserSettings {
  /**
   * Last view name for routing (DESK PARITY: top-level key)
   * Desk source: list_view.js:616
   * Values: "List", "Report", "Dashboard", "Kanban", "Calendar", "Gantt", etc.
   */
  last_view?: string
  
  Form?: FormSettings
  GridView?: GridViewSettings
  List?: ListSettings
  Kanban?: KanbanSettings
  Calendar?: CalendarSettings
  Gantt?: GanttSettings
  Image?: ImageSettings
  Inbox?: InboxSettings
  Report?: ReportSettings
  
  /**
   * Allow unknown keys for forward/backward compatibility
   * Desk may add new view types in future versions
   */
  [key: string]: any
}

/**
 * Helper to create empty settings with proper typing
 */
export function createEmptySettings(): UserSettings {
  return {}
}

/**
 * Helper to merge settings (Desk merge semantics)
 * Shallow merge at top level (Form, GridView, etc.)
 * Deep merge where Desk does (e.g., GridView per child table)
 */
export function mergeSettings(
  existing: UserSettings,
  updates: Partial<UserSettings>
): UserSettings {
  const merged = { ...existing }
  
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined) {
      continue
    }
    
    // Deep merge for GridView (per child table)
    if (key === 'GridView' && typeof value === 'object') {
      merged.GridView = {
        ...merged.GridView,
        ...value
      }
    }
    // Deep merge for Form
    else if (key === 'Form' && typeof value === 'object') {
      merged.Form = {
        ...merged.Form,
        ...value
      }
    }
    // Other buckets: replace
    else {
      merged[key] = value
    }
  }
  
  return merged
}


