import { useQuery, useQueryClient } from '@tanstack/react-query'
import { call } from './client'
import { useBoot } from './hooks'
import type { 
  WorkspaceDetails, 
  Workspace,
  BootData
} from '@/lib/types/workspace'
import { findWorkspace } from '@/lib/utils/workspace'
import { getBootUserObject, getBootUserRoles } from '@/lib/utils/boot'

/**
 * Use workspaces from boot data (ERPNext pattern)
 * Pattern from: frappe/desk.js setup_workspaces()
 * 
 * NO separate API call - uses boot data loaded on app start
 */
export function useWorkspaces() {
  const { data: boot, isLoading, error } = useBoot()
  const user = getBootUserObject(boot)
  const roles = getBootUserRoles(boot)
  
  return {
    data: {
      pages: boot?.allowed_workspaces || [],
      has_access: roles.includes('Workspace Manager') || false,
      has_create_access: user?.can_create?.includes('Workspace') || false
    },
    isLoading,
    error
  }
}

/**
 * Fetch workspace details (cards, shortcuts, charts)
 * Pattern from: frappe/views/workspace/workspace.js get_data()
 * 
 * Caches per workspace, invalidates on workspace edit
 */
export async function fetchWorkspaceDetails(
  workspace: Workspace
): Promise<WorkspaceDetails> {
  const result = await call('frappe.desk.desktop.get_desktop_page', {
    page: JSON.stringify(workspace)
  })
  return result.message || result
}

/**
 * Hook: Get workspace details with caching
 * Pattern from: frappe/views/workspace/workspace.js show_page()
 */
export function useWorkspaceDetails(workspace: Workspace | null) {
  return useQuery({
    queryKey: ['workspace-details', workspace?.name],
    queryFn: () => fetchWorkspaceDetails(workspace!),
    enabled: !!workspace,
    staleTime: 5 * 60 * 1000, // 5 minutes (ERPNext caches in memory)
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
    retry: 2, // Retry failed requests
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Don't refetch on window focus
  })
}

/**
 * Hook: Get workspace by name
 * Pattern from: frappe/views/workspace/workspace.js get_page_to_show()
 */
export function useWorkspaceByName(workspaceName: string) {
  const { data: workspaceData } = useWorkspaces()
  
  const workspace = findWorkspace(
    workspaceData.pages,
    workspaceName
  )
  
  return {
    workspace,
    isLoading: false,
    error: workspace ? null : new Error(`Workspace "${workspaceName}" not found`)
  }
}

/**
 * Invalidate workspace cache (call after workspace edit)
 * Pattern from: frappe/views/workspace/workspace.js reload()
 */
export function useInvalidateWorkspace() {
  const queryClient = useQueryClient()
  
  return {
    invalidateWorkspace: (workspaceName: string) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-details', workspaceName] })
    },
    invalidateAllWorkspaces: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-details'] })
      queryClient.invalidateQueries({ queryKey: ['boot'] }) // Refresh boot data
    }
  }
}

