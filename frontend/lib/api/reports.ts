/**
 * Report APIs - Query Reports and Report Builder
 * 
 * Based on:
 * - frappe/desk/query_report.py
 * - frappe/public/js/frappe/views/reports/query_report.js
 */

import { call } from './client'

/**
 * Run a query report
 * 
 * Based on: frappe/desk/query_report.py::run()
 * 
 * @param reportName - Report name
 * @param filters - Report filters
 */
export async function runQueryReport(
  reportName: string,
  filters?: Record<string, any>
): Promise<{
  columns: any[]
  result: any[]
  message?: string
  chart?: any
  report_summary?: any
  skip_total_row?: boolean
  status?: string
}> {
  try {
    const result = await call('frappe.desk.query_report.run', {
      report_name: reportName,
      filters: filters ? JSON.stringify(filters) : undefined
    })
    
    return result.message || {}
  } catch (error) {
    console.error('[runQueryReport] Error running report:', error)
    throw error
  }
}

/**
 * Export query report to CSV/Excel
 * 
 * Uses Desk's export pattern: POST form submission to download file
 * Based on: frappe/desk/query_report.py::export_query() and 
 * frappe/public/js/frappe/views/reports/query_report.js export action
 * 
 * @param params - Export parameters matching Desk's export_query args
 */
export async function exportQueryReport(params: {
  report_name: string
  filters?: Record<string, any>
  file_format_type: 'CSV' | 'Excel'
  visible_idx?: number[]
  selected_items?: string[]
  export_in_background?: boolean
  csv_delimiter?: string
  csv_quoting?: string
}): Promise<void> {
  // Desk uses open_url_post pattern: create form and submit
  // This triggers browser download instead of XHR fetch
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = '/api/method/frappe.desk.query_report.export_query'
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
  
  addField('report_name', params.report_name)
  addField('filters', params.filters ? JSON.stringify(params.filters) : undefined)
  addField('file_format_type', params.file_format_type)
  addField('visible_idx', params.visible_idx ? JSON.stringify(params.visible_idx) : undefined)
  addField('selected_items', params.selected_items ? JSON.stringify(params.selected_items) : undefined)
  addField('export_in_background', params.export_in_background ? '1' : undefined)
  addField('csv_delimiter', params.csv_delimiter)
  addField('csv_quoting', params.csv_quoting)
  
  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}

