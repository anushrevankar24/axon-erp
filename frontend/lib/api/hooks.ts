/**
 * React Query Hooks - ERPNext Pattern
 * 
 * Uses Desk API for document operations to get full validation and error handling.
 * 
 * API Pattern:
 * - Document CRUD: Desk API (frappe.desk.form.*)
 * - List/Report: Desk API (frappe.desk.reportview.*)
 * - Authentication: Already using Desk API (see client.ts)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { call } from './client'
import { useMemo } from 'react'
import { getList, getListCount, getListFields } from './list'
import { 
  getDocument, 
  getDocType, 
  saveDocument, 
  deleteDocument,
  type DocumentSaveResult 
} from './document'
import { DocTypeMeta, DocInfo } from '@/lib/types/metadata'

// ============================================================================
// DocType Metadata Hooks
// ============================================================================

/**
 * Fetch DocType metadata using Desk API
 * Returns the full meta with all fields, links, and child table metas
 */
export function useMeta(doctype: string) {
  return useQuery({
    queryKey: ['meta', doctype],
    queryFn: async () => {
      const result = await getDocType(doctype)
      
      if (!result.success || !result.meta) {
        throw new Error(result.error?.message || `No metadata returned for ${doctype}`)
      }
      
      return result.meta
    },
    enabled: !!doctype,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  })
}

/**
 * Get all child table metas for a DocType
 */
export function useMetaBundle(doctype: string) {
  return useQuery({
    queryKey: ['meta-bundle', doctype],
    queryFn: async () => {
      const result = await getDocType(doctype)
      
      if (!result.success) {
        throw new Error(result.error?.message || `Failed to load ${doctype}`)
      }
      
      return {
        meta: result.meta,
        docs: result.docs, // Includes child table metas
        user_settings: result.user_settings
      }
    },
    enabled: !!doctype,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Fetch DocType metadata using Frappe's production endpoint
 * Returns complete meta with permissions, workflows, custom scripts
 */
export function useDocTypeMeta(doctype: string) {
  return useQuery({
    queryKey: ['doctype_meta', doctype],
    queryFn: async () => {
      const result = await call('frappe.desk.form.load.getdoctype', {
        doctype: doctype
      })
      
      if (!result.docs || result.docs.length === 0) {
        throw new Error(`No metadata returned for ${doctype}`)
      }
      
      // result.docs[0] is the main DocType meta
      // result.docs[1+] are child table metas
      return {
        meta: result.docs[0] as DocTypeMeta,
        childMetas: result.docs.slice(1),
        user_settings: result.user_settings
      }
    },
    enabled: !!doctype,
    staleTime: 30 * 60 * 1000,  // 30 minutes - metadata doesn't change often
    retry: 1,
  })
}

/**
 * Get document-specific permissions and info
 * This returns permissions calculated for the specific document
 * (considers owner, user permissions, workflow state)
 */
export function useDocInfo(doctype: string, name?: string) {
  return useQuery({
    queryKey: ['docinfo', doctype, name],
    queryFn: async () => {
      const result = await call('frappe.desk.form.load.get_docinfo', {
        doctype,
        name
      })
      return result.message as DocInfo
    },
    enabled: !!(doctype && name && name !== 'new'),
    staleTime: 0,  // Don't cache - permissions can change
    retry: 1,
  })
}

// ============================================================================
// Document Hooks - Using Desk API
// ============================================================================

/**
 * Fetch single document using Desk API
 * Returns document with docinfo (attachments, comments, versions, etc.)
 */
export function useDoc(doctype: string, name?: string) {
  return useQuery({
    queryKey: ['doc', doctype, name],
    queryFn: async () => {
      const result = await getDocument(doctype, name!)
      
      if (!result.success) {
        // Return null for not found (handled by component)
        if (result.error?.type === 'not_found') {
          return null
        }
        throw new Error(result.error?.message || 'Failed to load document')
      }
      
      return result.doc
    },
    enabled: !!name && name !== 'new',
    retry: 1,
  })
}

/**
 * Fetch document with docinfo (for document view with timeline, attachments, etc.)
 */
export function useDocWithInfo(doctype: string, name?: string) {
  return useQuery({
    queryKey: ['doc-with-info', doctype, name],
    queryFn: async () => {
      const result = await getDocument(doctype, name!)
      
      if (!result.success) {
        if (result.error?.type === 'not_found') {
          return null
        }
        throw new Error(result.error?.message || 'Failed to load document')
      }
      
      return {
        doc: result.doc,
        docinfo: result.docinfo
      }
    },
    enabled: !!name && name !== 'new',
    retry: 1,
  })
}

/**
 * Fetch document list using Desk API
 * Uses frappe.desk.reportview.get_list for full functionality
 */
export function useDocList(doctype: string, filters?: any) {
  return useQuery({
    queryKey: ['list', doctype, filters],
    queryFn: async () => {
      const result = await getList({
        doctype,
        filters,
        fields: ['name'],
        limit_page_length: 20
      })
      return result
    },
    retry: 1,
  })
}

// ============================================================================
// Document Mutation Hooks - Using Desk API
// ============================================================================

/**
 * Save document mutation (create or update)
 * Uses Desk API for full validation and error handling
 */
export function useSaveDoc(doctype: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { 
      doc: any
      action?: 'Save' | 'Submit' | 'Update' 
    }): Promise<DocumentSaveResult> => {
      const docToSave = {
        doctype,
        ...data.doc,
        __unsaved: 1,
      }
      
      // Mark as new if no name
      if (!data.doc.name) {
        docToSave.__islocal = 1
      }
      
      return saveDocument(docToSave, data.action || 'Save')
    },
    onSuccess: (result) => {
      if (result.success && result.doc) {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['list', doctype] })
        queryClient.invalidateQueries({ queryKey: ['list-data'] })
        
        // Update the document cache
        if (result.doc.name) {
          queryClient.setQueryData(['doc', doctype, result.doc.name], result.doc)
        }
      }
    }
  })
}

/**
 * Create document mutation (convenience wrapper)
 * @deprecated Use useSaveDoc for full functionality
 */
export function useCreateDoc(doctype: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: any): Promise<DocumentSaveResult> => {
      const docToSave = {
        doctype,
        ...data,
        __islocal: 1,
        __unsaved: 1,
      }
      
      return saveDocument(docToSave, 'Save')
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['list', doctype] })
        queryClient.invalidateQueries({ queryKey: ['list-data'] })
      }
    }
  })
}

/**
 * Update document mutation (convenience wrapper)
 * @deprecated Use useSaveDoc for full functionality
 */
export function useUpdateDoc(doctype: string, name: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: any): Promise<DocumentSaveResult> => {
      const docToSave = {
        doctype,
        name,
        ...data,
        __unsaved: 1,
      }
      
      return saveDocument(docToSave, 'Save')
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['doc', doctype, name] })
        queryClient.invalidateQueries({ queryKey: ['list', doctype] })
        queryClient.invalidateQueries({ queryKey: ['list-data'] })
      }
    }
  })
}

/**
 * Delete document mutation
 */
export function useDeleteDoc(doctype: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (name: string) => {
      return deleteDocument(doctype, name)
    },
    onSuccess: (result, name) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['list', doctype] })
        queryClient.invalidateQueries({ queryKey: ['list-data'] })
        queryClient.removeQueries({ queryKey: ['doc', doctype, name] })
      }
    }
  })
}

// ============================================================================
// Boot and Auth Hooks
// ============================================================================

/**
 * Get boot info - Uses wrapper around Frappe's internal sessions.get()
 * 
 * Note: frappe.sessions.get is NOT a whitelisted API endpoint (it's internal),
 * so we need a wrapper. ERPNext's UI gets boot data embedded in HTML server-side,
 * but separate frontends need an API endpoint.
 * 
 * This is the standard pattern for Frappe mobile apps and third-party integrations.
 */
export function useBoot() {
  return useQuery({
    queryKey: ['boot'],
    queryFn: async () => {
      // Call our wrapper which internally calls frappe.sessions.get()
      const result = await call('axon_erp.api.get_boot')
      return result.message || result
    },
    staleTime: 10 * 60 * 1000,  // Cache for 10 minutes
    refetchOnWindowFocus: false,
    retry: false,  // Don't retry on error
  })
}

/**
 * Get all DocTypes - Separate independent query
 * Uses Frappe's standard get_list endpoint
 */
export function useAllDocTypes() {
  return useQuery({
    queryKey: ['all_doctypes'],
    queryFn: async () => {
      // Use Frappe's standard get_list endpoint
      const result = await call('frappe.client.get_list', {
        doctype: 'DocType',
        filters: [
          ['istable', '=', 0],
          ['issingle', '=', 0]
        ],
        fields: ['name', 'module', 'icon', 'custom'],
        limit_page_length: 0
      })
      return result.message
    },
    staleTime: 30 * 60 * 1000,  // Cache longer - doesn't change often
    enabled: true,
  })
}

/**
 * Get DocTypes grouped by module
 */
export function useDocTypesByModule() {
  const { data, isLoading, error } = useAllDocTypes()
  
  const grouped = useMemo(() => {
    if (!data || data.length === 0) return {}
    
    const grouped: Record<string, any[]> = {}
    data.forEach((dt: any) => {
      const module = dt.module || 'Other'
      if (!grouped[module]) grouped[module] = []
      grouped[module].push(dt)
    })
    
    // Sort modules alphabetically
    const sorted = Object.keys(grouped)
      .sort()
      .reduce((acc, key) => {
        acc[key] = grouped[key].sort((a: any, b: any) => a.name.localeCompare(b.name))
        return acc
      }, {} as Record<string, any[]>)
    
    return sorted
  }, [data])
  
  return { data: grouped, isLoading, error }
}

// ============================================================================
// Setup Wizard Hooks
// ============================================================================

export function useSetupStages() {
  return useQuery({
    queryKey: ['setup-stages'],
    queryFn: async () => {
      const result = await call('frappe.desk.page.setup_wizard.setup_wizard.get_setup_stages')
      return result.message
    }
  })
}

export function useProcessSetup() {
  return useMutation({
    mutationFn: async (data: { stages: any[], user_input: any }) => {
      return call('frappe.desk.page.setup_wizard.setup_wizard.process_setup_stages', {
        stages: data.stages,
        ...data.user_input
      })
    }
  })
}

// ============================================================================
// List Hooks - Using Desk API
// ============================================================================

/**
 * Enhanced list data hook using reportview API
 */
export function useListData(params: {
  doctype: string
  filters?: Record<string, any>
  searchText?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
  fields?: string[]
}) {
  const { data: meta } = useMeta(params.doctype)
  
  const fields = useMemo(() => {
    if (params.fields) return params.fields
    if (!meta) return ['name']
    return getListFields(meta)
  }, [params.fields, meta])
  
  return useQuery({
    queryKey: ['list-data', params],
    queryFn: async () => {
      const data = await getList({
        doctype: params.doctype,
        fields,
        filters: params.filters,
        order_by: params.sortBy 
          ? `${params.sortBy} ${params.sortOrder || 'asc'}` 
          : 'modified desc',
        limit_start: ((params.page || 1) - 1) * (params.pageSize || 20),
        limit_page_length: params.pageSize || 20,
        with_comment_count: true,
      })
      
      return data
    },
    enabled: !!params.doctype && !!meta,  // Wait for meta to load
    placeholderData: (previousData) => previousData,  // Smooth pagination (replaces keepPreviousData)
    staleTime: 30 * 1000,
  })
}

/**
 * Get list count for pagination
 */
export function useListCount(doctype: string, filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['list-count', doctype, filters],
    queryFn: () => getListCount(doctype, filters),
    enabled: !!doctype,
    staleTime: 60 * 1000,
  })
}

// ============================================================================
// Re-export workspace hooks
// ============================================================================

export * from './workspace'
