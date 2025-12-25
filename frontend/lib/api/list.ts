import { call } from './client'

export interface ListFilters {
  [key: string]: any
}

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
  } catch (error) {
    console.error('[getList] Error fetching list:', error)
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

