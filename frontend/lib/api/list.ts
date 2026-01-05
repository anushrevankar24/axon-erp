import { call } from './client'

export interface ListFilters {
  [key: string]: any
}

// Desk-style filter tuple: [doctype, fieldname, operator, value] or [fieldname, operator, value]
export type FilterTuple = [string, string, string, any] | [string, string, any]

export interface ListParams {
  doctype: string
  fields?: string[]
  filters?: ListFilters
  or_filters?: ListFilters[]
  order_by?: string
  limit_start?: number
  limit_page_length?: number
  group_by?: string
  with_comment_count?: boolean
}

// Desk-style reportview.get params (compressed payload response)
export interface ReportViewGetParams {
  doctype: string
  fields?: string[]
  filters?: FilterTuple[]
  or_filters?: FilterTuple[]
  order_by?: string
  start?: number
  page_length?: number
  view?: 'List' | 'Report'
  group_by?: string
  with_comment_count?: boolean
  // Desk/Frappe reportview.get uses DatabaseQuery.execute(add_total_row=...)
  // (note: singular), not add_totals_row (plural, used by export_query).
  add_total_row?: boolean
  save_user_settings?: boolean
}

// Response from frappe.desk.reportview.get (compressed format)
export interface ReportViewGetResponse {
  keys: string[]
  values: any[][]
  user_info?: Record<string, any>
}

// Get list of documents using reportview API
export async function getList(params: ListParams): Promise<any[]> {
  try {
    const response = await call('frappe.desk.reportview.get_list', {
      doctype: params.doctype,
      fields: JSON.stringify(params.fields || ['name']),
      filters: params.filters ? JSON.stringify(params.filters) : undefined,
      or_filters: params.or_filters ? JSON.stringify(params.or_filters) : undefined,
      order_by: params.order_by || 'modified desc',
      start: params.limit_start || 0,
      page_length: params.limit_page_length || 20,
      group_by: params.group_by,
      with_comment_count: params.with_comment_count ? 1 : 0,
    })
    
    // The API returns an array of objects directly
    const data = response?.message || []
    return Array.isArray(data) ? data : []
  } catch (error: any) {
    // Avoid noisy logs for expected cases:
    // - 401/403 when session expired or user lacks permission (handled elsewhere)
    // - explicit PermissionError from Frappe
    // - our interceptor may throw Error('Session expired') after redirect
    const status = error?.response?.status ?? error?.httpStatus
    const excType = error?.response?.data?.exc_type ?? error?.exc_type
    const message = error?.message

    const isAuthOrPermission =
      status === 401 ||
      status === 403 ||
      excType === 'PermissionError' ||
      message === 'Session expired'

    if (!isAuthOrPermission && process.env.NODE_ENV !== 'production') {
      console.error('[getList] Error fetching list:', {
        status,
        excType,
        message,
        data: error?.response?.data,
        url: error?.config?.url,
      })
    }

    return []
  }
}

// Data is already formatted as objects, no conversion needed
export function formatListResponse(data: any[]): any[] {
  return data
}

// Get count for list
export async function getListCount(doctype: string, filters?: ListFilters) {
  try {
    const response = await call('frappe.desk.reportview.get_count', {
      doctype,
      filters: filters ? JSON.stringify(filters) : undefined,
    })
    
    return response?.message || 0
  } catch (error) {
    console.error('Error fetching count:', error)
    return 0
  }
}

// Search in list
export async function searchList(params: ListParams & { txt: string }) {
  try {
    const response = await call('frappe.desk.search.search_widget', {
      doctype: params.doctype,
      txt: params.txt,
      filters: params.filters ? JSON.stringify(params.filters) : undefined,
      page_length: params.limit_page_length || 20,
      start: params.limit_start || 0,
    })
    
    return response?.message || []
  } catch (error) {
    console.error('Error searching:', error)
    return []
  }
}

// Get filter metadata for doctype
export async function getStandardFilters(doctype: string) {
  // Common filters that apply to most doctypes
  const standardFilters = [
    {
      fieldname: 'name',
      label: 'ID',
      fieldtype: 'Data'
    },
    {
      fieldname: 'modified',
      label: 'Last Modified',
      fieldtype: 'Datetime'
    },
    {
      fieldname: 'creation',
      label: 'Created On',
      fieldtype: 'Datetime'
    },
    {
      fieldname: 'owner',
      label: 'Created By',
      fieldtype: 'Link',
      options: 'User'
    },
    {
      fieldname: 'modified_by',
      label: 'Modified By',
      fieldtype: 'Link',
      options: 'User'
    }
  ]
  
  return standardFilters
}

// Get list fields from meta
export function getListFields(meta: any): string[] {
  if (!meta || !meta.fields) return ['name']
  
  const fields: string[] = ['name']
  
  // Add title field if exists
  if (meta.title_field && meta.title_field !== 'name') {
    fields.push(meta.title_field)
  }
  
  // Add fields marked for list view
  meta.fields.forEach((field: any) => {
    if (field.in_list_view && !fields.includes(field.fieldname)) {
      fields.push(field.fieldname)
    }
  })
  
  // Add standard fields
  const standardFields = ['modified', 'owner', 'creation']
  standardFields.forEach(f => {
    if (!fields.includes(f)) {
      fields.push(f)
    }
  })
  
  // Limit to 10 fields for performance
  return fields.slice(0, 10)
}

// Bulk delete documents
export async function bulkDelete(doctype: string, names: string[]) {
  try {
    const promises = names.map(name => 
      call('frappe.client.delete', {
        doctype,
        name
      })
    )
    await Promise.all(promises)
    return { success: true }
  } catch (error) {
    console.error('Error bulk deleting:', error)
    throw error
  }
}

// ============================================================================
// Desk Parity APIs - List/ReportView
// ============================================================================

/**
 * Get list data using Desk's canonical reportview.get method
 * 
 * This is the method Desk uses (base_list.js sets this.method = "frappe.desk.reportview.get")
 * Returns compressed payload: {keys, values, user_info}
 * 
 * Based on: frappe/desk/reportview.py::get() and frappe/public/js/frappe/list/base_list.js
 */
export async function reportviewGet(params: ReportViewGetParams): Promise<ReportViewGetResponse> {
  try {
    const response = await call('frappe.desk.reportview.get', {
      doctype: params.doctype,
      fields: JSON.stringify(params.fields || ['name']),
      filters: params.filters ? JSON.stringify(params.filters) : undefined,
      or_filters: params.or_filters ? JSON.stringify(params.or_filters) : undefined,
      order_by: params.order_by || 'modified desc',
      start: params.start || 0,
      page_length: params.page_length || 20,
      view: params.view || 'List',
      group_by: params.group_by,
      with_comment_count: params.with_comment_count ? 1 : 0,
      add_total_row: params.add_total_row ? 1 : undefined,
      save_user_settings: params.save_user_settings !== false ? 1 : 0,
    })
    
    // Desk returns compressed format: {keys: [...], values: [[...]], user_info: {...}}
    return response?.message || { keys: [], values: [], user_info: {} }
  } catch (error: any) {
    const status = error?.response?.status ?? error?.httpStatus
    const excType = error?.response?.data?.exc_type ?? error?.exc_type
    const message = error?.message

    const isAuthOrPermission =
      status === 401 ||
      status === 403 ||
      excType === 'PermissionError' ||
      message === 'Session expired'

    if (!isAuthOrPermission && process.env.NODE_ENV !== 'production') {
      console.error('[reportviewGet] Error fetching reportview:', {
        status,
        excType,
        message,
        data: error?.response?.data,
        url: error?.config?.url,
      })
    }

    return { keys: [], values: [], user_info: {} }
  }
}

/**
 * Normalize compressed reportview.get response into row objects
 * 
 * Converts {keys: ['name', 'owner'], values: [['DOC-001', 'admin']]} 
 * to [{name: 'DOC-001', owner: 'admin'}]
 */
export function normalizeCompressedResponse(response: ReportViewGetResponse): any[] {
  if (!response.keys || !response.values) return []
  
  return response.values.map(row => {
    const obj: Record<string, any> = {}
    response.keys.forEach((key, idx) => {
      obj[key] = row[idx]
    })
    return obj
  })
}

/**
 * Get sidebar stats (tag counts, workflow states, etc.)
 * 
 * Based on: frappe/desk/reportview.py::get_sidebar_stats() and 
 * frappe/public/js/frappe/list/list_sidebar.js::get_stats()
 * 
 * @param stats - Array of field names to get stats for (e.g., ['_user_tags', 'status'])
 * @param doctype - DocType name
 * @param filters - Current filters (tuple format) to scope the stats
 */
export async function getSidebarStats(
  stats: string[],
  doctype: string,
  filters?: FilterTuple[]
): Promise<{ stats: Record<string, any> }> {
  try {
    const response = await call('frappe.desk.reportview.get_sidebar_stats', {
      stats: JSON.stringify(stats),
      doctype,
      filters: filters ? JSON.stringify(filters) : undefined,
    })
    
    return response?.message || { stats: {} }
  } catch (error) {
    console.error('[getSidebarStats] Error fetching sidebar stats:', error)
    return { stats: {} }
  }
}

/**
 * Get group-by field counts for list sidebar filters
 * 
 * Used for "Assigned To" and "Created By" dropdowns with counts
 * Based on: frappe/desk/listview.py::get_group_by_count() and 
 * frappe/public/js/frappe/list/list_sidebar_group_by.js::get_group_by_count()
 * 
 * @param params - Group-by parameters
 * @returns Array of {name, count} for dropdown options
 */
export async function getGroupByCount(params: {
  doctype: string
  current_filters: FilterTuple[]
  field: 'owner' | 'assigned_to'
}): Promise<Array<{ name: string | null; count: number }>> {
  try {
    const response = await call('frappe.desk.listview.get_group_by_count', {
      doctype: params.doctype,
      current_filters: JSON.stringify(params.current_filters || []),
      field: params.field,
    })
    
    return response?.message || []
  } catch (error) {
    console.error('[getGroupByCount] Error fetching group-by counts:', error)
    return []
  }
}

/**
 * Export list data to CSV/Excel
 * 
 * Uses Desk's export pattern: POST form submission to download file
 * Based on: frappe/desk/reportview.py::export_query() and 
 * frappe/public/js/frappe/views/reports/report_view.js export action
 * 
 * @param params - Export parameters matching Desk's export_query args
 */
export async function exportReportView(params: {
  doctype: string
  fields?: string[]
  filters?: FilterTuple[]
  or_filters?: FilterTuple[]
  order_by?: string
  start?: number
  page_length?: number
  file_format_type: 'CSV' | 'Excel'
  title?: string
  selected_items?: string[]
  add_totals_row?: boolean
  translate_values?: boolean
  export_in_background?: boolean
  csv_delimiter?: string
  csv_quoting?: string
}): Promise<void> {
  // Desk uses open_url_post pattern: create form and submit
  // This triggers browser download instead of XHR fetch
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = '/api/method/frappe.desk.reportview.export_query'
  form.target = '_blank'
  form.style.display = 'none'
  
  const addField = (name: string, value: any) => {
    if (value === undefined || value === null) return
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = typeof value === 'string' ? value : JSON.stringify(value)
    form.appendChild(input)
  }
  
  addField('doctype', params.doctype)
  addField('fields', JSON.stringify(params.fields || ['name']))
  addField('filters', params.filters ? JSON.stringify(params.filters) : undefined)
  addField('or_filters', params.or_filters ? JSON.stringify(params.or_filters) : undefined)
  addField('order_by', params.order_by || 'modified desc')
  addField('start', params.start)
  addField('page_length', params.page_length)
  addField('file_format_type', params.file_format_type)
  addField('title', params.title || params.doctype)
  addField('selected_items', params.selected_items ? JSON.stringify(params.selected_items) : undefined)
  addField('add_totals_row', params.add_totals_row ? '1' : undefined)
  addField('translate_values', params.translate_values ? '1' : undefined)
  addField('export_in_background', params.export_in_background ? '1' : undefined)
  addField('csv_delimiter', params.csv_delimiter)
  addField('csv_quoting', params.csv_quoting)
  
  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}

