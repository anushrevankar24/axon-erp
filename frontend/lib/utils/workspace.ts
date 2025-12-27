import type { Workspace, BootData } from '@/lib/types/workspace'

/**
 * Get workspace by name or title
 * Pattern from: frappe/views/workspace/workspace.js get_page_to_show()
 */
export function findWorkspace(
  workspaces: Workspace[],
  nameOrTitle: string
): Workspace | null {
  return workspaces.find(
    ws => ws.name === nameOrTitle || 
          ws.title === nameOrTitle ||
          slugify(ws.name) === slugify(nameOrTitle)
  ) || null
}

/**
 * Get workspace for a DocType
 * Pattern from: frappe/views/breadcrumbs.js set_workspace()
 */
export function getWorkspaceForDocType(
  doctype: string,
  boot: BootData
): string | null {
  // 1. Check localStorage for user preference (ERPNext pattern)
  const preferredModule = localStorage.getItem(`preferred_breadcrumbs:${doctype}`)
  
  // 2. Get DocType's module from metadata
  const doctypeMeta = boot.docs?.find(
    (d: any) => d.name === doctype && d.doctype === 'DocType'
  )
  const module = preferredModule || doctypeMeta?.module
  
  // 3. Map module → workspace using boot.module_wise_workspaces
  if (module && boot.module_wise_workspaces?.[module]) {
    return boot.module_wise_workspaces[module][0]
  }
  
  return null
}

/**
 * Get default workspace
 * Pattern from: frappe/views/workspace/workspace.js get_page_to_show()
 */
export function getDefaultWorkspace(boot: BootData): Workspace | null {
  const workspaces = boot.allowed_workspaces || []
  
  // 1. User's default workspace preference
  if (boot.user?.default_workspace) {
    const defaultWS = findWorkspace(
      workspaces,
      boot.user.default_workspace.title
    )
    if (defaultWS) return defaultWS
  }
  
  // 2. localStorage (last visited)
  const lastWorkspace = localStorage.getItem('current_workspace')
  if (lastWorkspace) {
    const lastWS = findWorkspace(workspaces, lastWorkspace)
    if (lastWS) return lastWS
  }
  
  // 3. First available workspace
  return workspaces[0] || null
}

/**
 * Slugify workspace name for URLs
 * Pattern from: frappe/router.js slug()
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
}

/**
 * Remember workspace preference for DocType
 * Pattern from: frappe/views/breadcrumbs.js set_doctype_module()
 */
export function rememberWorkspaceForDocType(doctype: string, workspace: string) {
  localStorage.setItem(`preferred_breadcrumbs:${doctype}`, workspace)
}

