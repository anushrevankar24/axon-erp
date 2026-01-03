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
   * Collapsed sections state
   * Maps section fieldname → collapsed (true/false)
   * Desk source: frappe/public/js/frappe/form/layout.js
   */
  collapsed_sections?: Record<string, boolean>
  
  /**
   * Active tab for tabbed layouts
   * Stores the fieldname of the currently active Tab Break
   * Desk source: frappe/public/js/frappe/form/layout.js
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
   * Saved filters
   * Desk source: frappe/public/js/frappe/list/list_view.js
   */
  filters?: ListFilter[]
  
  /**
   * Sort order (e.g., "modified desc", "creation asc")
   */
  order_by?: string
  
  /**
   * Visible columns/fields
   */
  fields?: string[]
  
  /**
   * Page length (20, 100, 500, etc.)
   */
  page_length?: number
  
  /**
   * Last view state (e.g., "List", "Report", "Dashboard")
   * Some DocTypes support multiple list presentations
   */
  last_view?: string
}

// ============================================================================
// Kanban View Settings
// ============================================================================

export interface KanbanSettings {
  /**
   * Kanban board settings
   * Desk source: frappe/public/js/frappe/views/kanban/kanban_view.js
   */
  filters?: ListFilter[]
  
  /**
   * Field to use for kanban columns (Status, Priority, etc.)
   */
  kanban_column_field?: string
  
  /**
   * Fields to display on kanban cards
   */
  kanban_fields?: string[]
}

// ============================================================================
// Calendar View Settings
// ============================================================================

export interface CalendarSettings {
  /**
   * Calendar view settings
   * Desk source: frappe/public/js/frappe/views/calendar/calendar.js
   */
  filters?: ListFilter[]
  
  /**
   * Field to use for event start date
   */
  start_date_field?: string
  
  /**
   * Field to use for event end date (optional)
   */
  end_date_field?: string
  
  /**
   * Field to group calendar events by
   */
  group_by_field?: string
}

// ============================================================================
// Gantt View Settings
// ============================================================================

export interface GanttSettings {
  /**
   * Gantt chart settings
   * Desk source: frappe/public/js/frappe/views/gantt/gantt_view.js
   */
  filters?: ListFilter[]
  
  /**
   * Field to use for task start
   */
  start_date_field?: string
  
  /**
   * Field to use for task end
   */
  end_date_field?: string
  
  /**
   * View mode (Day, Week, Month, Year)
   */
  view_mode?: string
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
   * Inbox/communications view settings
   * Used for email/communication views in Desk
   */
  filters?: ListFilter[]
  
  /**
   * Inbox view mode or grouping
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

