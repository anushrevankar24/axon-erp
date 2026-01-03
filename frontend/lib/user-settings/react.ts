/**
 * User Settings React Hooks
 * 
 * React Query integration for user_settings with automatic caching and invalidation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userSettingsService } from './service'
import type { UserSettings } from './schema'

/**
 * Hook to read user_settings for a DocType
 * 
 * Caches in React Query for performance.
 * Use this when you only need to read settings.
 */
export function useUserSettings(doctype: string) {
  return useQuery({
    queryKey: ['user-settings', doctype],
    queryFn: () => userSettingsService.get(doctype),
    enabled: !!doctype,
    staleTime: 5 * 60 * 1000,  // Cache for 5 minutes
    retry: 1
  })
}

/**
 * Hook to save user_settings for a DocType
 * 
 * Debounced writes via the service layer.
 * Automatically invalidates the query cache on success.
 */
export function useSaveUserSettings(doctype: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      await userSettingsService.save(doctype, updates)
    },
    onSuccess: () => {
      // Invalidate cache so next read gets fresh data
      queryClient.invalidateQueries({ queryKey: ['user-settings', doctype] })
    }
  })
}

/**
 * Hook to save user_settings immediately (skip debounce)
 * 
 * Use for critical saves (e.g., on navigation, before logout).
 */
export function useSaveUserSettingsImmediate(doctype: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      await userSettingsService.save(doctype, updates, true)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', doctype] })
    }
  })
}

/**
 * Hook to flush all pending writes
 * 
 * Call before navigation or on app unmount.
 */
export function useFlushUserSettings() {
  return useMutation({
    mutationFn: () => userSettingsService.flush()
  })
}

/**
 * Get diagnostics info (for dev panel)
 */
export function useUserSettingsDiagnostics() {
  return {
    pendingCount: userSettingsService.getPendingCount(),
    pendingWrites: userSettingsService.getPendingWrites()
  }
}

