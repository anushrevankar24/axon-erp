// Core workspace types from ERPNext
export interface Workspace {
  name: string
  title: string
  module: string
  icon: string
  indicator_color: string
  is_hidden: number
  public: number
  parent_page: string
  content: string
  label: string
  for_user?: string
  sequence_id?: number
  is_editable?: boolean
  selected?: boolean
}

export interface WorkspaceSidebarResponse {
  pages: Workspace[]
  has_access: boolean
  has_create_access: boolean
}

// Link card types (from get_desktop_page response)
export interface WorkspaceLink {
  label: string
  type: 'Link' | 'Card Break'
  link_type?: 'DocType' | 'Report' | 'Page'
  link_to?: string
  onboard?: number
  dependencies?: string
  description?: string
  only_for?: string
  is_query_report?: number
  hidden?: number
  icon?: string
  incomplete_dependencies?: string[]
  count?: number
}

export interface WorkspaceCard {
  label: string
  icon?: string
  links: WorkspaceLink[]
}

// Shortcut types
export interface WorkspaceShortcut {
  label: string
  type: 'DocType' | 'Report' | 'Page' | 'Dashboard' | 'URL'
  link_to?: string
  url?: string
  doc_view?: string
  color?: string
  icon?: string
  format?: string
}

// Chart types
export interface WorkspaceChart {
  chart_name: string
  label: string
  chart_settings?: any
}

// Number card types
export interface WorkspaceNumberCard {
  number_card_name: string
  label: string
}

// Quick list types
export interface WorkspaceQuickList {
  label: string
  quick_list_filter?: string
  document_type: string
}

// Complete workspace details response (from get_desktop_page)
export interface WorkspaceDetails {
  cards: { items: WorkspaceCard[] }
  shortcuts: { items: WorkspaceShortcut[] }
  charts: { items: WorkspaceChart[] }
  number_cards: { items: WorkspaceNumberCard[] }
  quick_lists: { items: WorkspaceQuickList[] }
  onboardings?: { items: any[] }
  custom_blocks?: { items: any[] }
}

// Boot data structure
export interface BootData {
  user: string | any
  allowed_workspaces: Workspace[]
  module_wise_workspaces: Record<string, string[]>
  all_doctypes?: any[]  // Your custom addition
  docs?: any[]  // DocType metadata
  user_info?: any
  roles?: string[]
  [key: string]: any  // Other boot fields
}

