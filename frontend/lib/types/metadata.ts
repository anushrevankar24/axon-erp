/**
 * DocType Metadata Types
 * 
 * Type definitions for ERPNext/Frappe metadata structures
 * Based on: frappe/model/meta.py and frappe/desk/form/meta.py
 */

export interface DocField {
  fieldname: string
  fieldtype: string
  label: string
  permlevel: number
  reqd?: number
  hidden?: number
  read_only?: number
  allow_on_submit?: number
  depends_on?: string
  options?: string
  description?: string
  default?: any
  bold?: number
  in_list_view?: number
  in_standard_filter?: number
  length?: number
  precision?: number
  fetch_from?: string
  fetch_if_empty?: number
}

export interface DocPermission {
  role: string
  read: number
  write: number
  create: number
  delete: number
  submit: number
  cancel: number
  amend: number
  print: number
  email: number
  export: number
  import: number
  share: number
  permlevel: number
  if_owner: number
}

export interface DocTypeMeta {
  name: string
  module: string
  istable: number
  issingle: number
  is_submittable: number
  track_changes: number
  allow_rename: number
  autoname?: string
  title_field?: string
  search_fields?: string
  fields: DocField[]
  permissions: DocPermission[]
  __custom_js?: string
  __css?: string
  __print_formats?: any[]
  __workflow_docs?: any[]
  __form_grid_templates?: any
  __listview_template?: string
  __calendar_js?: string
  __tree_js?: string
  __dashboard?: any
}

export interface DocInfo {
  permissions: {
    read?: number
    write?: number
    submit?: number
    cancel?: number
    delete?: number
    amend?: number
    print?: number
    email?: number
    share?: number
  }
  shared?: any[]
  attachments?: any[]
  comments?: any[]
  versions?: any[]
  communications?: any[]
  assignments?: any[]
  views?: any[]
  energy_point_logs?: any[]
  is_document_followed?: boolean
  tags?: string
}

