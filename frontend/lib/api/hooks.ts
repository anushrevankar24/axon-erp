import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, call } from './client'
import { useMemo } from 'react'
import { getList, getListCount, getListFields } from './list'

// Fetch DocType metadata
export function useMeta(doctype: string) {
  return useQuery({
    queryKey: ['meta', doctype],
    queryFn: async () => {
      try {
        const result = await call('frappe.desk.form.load.getdoctype', { doctype })
        
        // The response structure is: {docs: [{...doctype_meta}], user_settings: '{}'}
        // OR with message wrapper: {message: {docs: [...], ...}}
        let metadata = null
        
        if (result.message) {
          // Wrapped in message
          metadata = result.message.docs?.[0] || result.message
        } else if (result.docs) {
          // Direct docs array
          metadata = result.docs[0]
        } else {
          // Maybe the result itself is the metadata
          metadata = result
        }
        
        if (!metadata) {
          console.error('[useMeta] No metadata found for:', doctype)
          throw new Error(`No metadata returned for ${doctype}`)
        }
        
        return metadata
      } catch (error) {
        console.error('[useMeta] Error fetching metadata for:', doctype, error)
        throw error
      }
    },
    enabled: !!doctype,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

// Fetch single document
export function useDoc(doctype: string, name?: string) {
  return useQuery({
    queryKey: ['doc', doctype, name],
    queryFn: async () => {
      try {
        const result = await db.getDoc(doctype, name!)
        return result || null
      } catch (error) {
        console.error('[useDoc] Error fetching document:', doctype, name, error)
        throw error
      }
    },
    enabled: !!name && name !== 'new',
    retry: 1,
  })
}

// Fetch document list
export function useDocList(doctype: string, filters?: any) {
  return useQuery({
    queryKey: ['list', doctype, filters],
    queryFn: async () => {
      try {
        const result = await db.getDocList(doctype, { 
          filters, 
          fields: ['*'],
          limit_page_length: 20 
        })
        return result
      } catch (error) {
        console.error('[useDocList] Error fetching list:', doctype, error)
        throw error
      }
    },
    retry: 1,
  })
}

// Get boot info (includes all DocTypes + ERPNext metadata)
export function useBoot() {
  return useQuery({
    queryKey: ['boot'],
    queryFn: async () => {
      try {
        const result = await call('axon_erp.api.get_boot')
        const boot = result.message || result
        console.log('[useBoot] Boot data loaded successfully')
        return boot
      } catch (error) {
        // If not authenticated, return empty boot (expected behavior)
        const status = (error as any)?.response?.status
        if (status === 401 || status === 403) {
          console.log('[useBoot] Not authenticated - returning empty boot')
          return {
            all_doctypes: [],
            user: 'Guest',
            modules: {}
          }
        }
        console.error('[useBoot] Unexpected error:', error)
        throw error
      }
    },
    staleTime: 10 * 60 * 1000,  // Cache for 10 minutes
    refetchOnWindowFocus: false,
    retry: false,  // Don't retry on error
  })
}

// Get all DocTypes from boot info
export function useAllDocTypes() {
  const { data: boot, isLoading, error } = useBoot()
  
  return {
    data: boot?.all_doctypes || [],
    isLoading,
    error
  }
}

// Get DocTypes grouped by module
export function useDocTypesByModule() {
  const { data: doctypes, isLoading, error } = useAllDocTypes()
  
  const grouped = useMemo(() => {
    if (!doctypes || doctypes.length === 0) return {}
    
    const grouped: Record<string, any[]> = {}
    doctypes.forEach((dt: any) => {
      const module = dt.module || 'Other'
      if (!grouped[module]) grouped[module] = []
      grouped[module].push(dt)
    })
    
    // Sort modules alphabetically
    const sorted = Object.keys(grouped)
      .sort()
      .reduce((acc, key) => {
        acc[key] = grouped[key].sort((a, b) => a.name.localeCompare(b.name))
        return acc
      }, {} as Record<string, any[]>)
    
    return sorted
  }, [doctypes])
  
  return { data: grouped, isLoading, error }
}

// Setup wizard hooks
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

// Document mutations
export function useCreateDoc(doctype: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: any) => {
      return db.createDoc(doctype, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list', doctype] })
    }
  })
}

export function useUpdateDoc(doctype: string, name: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: any) => {
      return db.updateDoc(doctype, name, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doc', doctype, name] })
      queryClient.invalidateQueries({ queryKey: ['list', doctype] })
    }
  })
}

// Enhanced list data hook using reportview API
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
    keepPreviousData: true,  // Smooth pagination
    staleTime: 30 * 1000,
  })
}

// Get list count for pagination
export function useListCount(doctype: string, filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['list-count', doctype, filters],
    queryFn: () => getListCount(doctype, filters),
    enabled: !!doctype,
    staleTime: 60 * 1000,
  })
}

