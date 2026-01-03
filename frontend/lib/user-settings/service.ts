/**
 * User Settings Service
 * 
 * Central service for reading/writing Frappe user_settings with:
 * - Debounced writes (avoid chatty API calls)
 * - Per-doctype write queues
 * - Merge semantics matching Desk
 * 
 * Uses only official Frappe APIs:
 * - frappe.model.utils.user_settings.get
 * - frappe.model.utils.user_settings.save
 */

import { call } from '@/lib/api/client'
import { parseUserSettings, serializeUserSettings } from './normalize'
import { mergeSettings, type UserSettings } from './schema'

// ============================================================================
// Write Queue (Debounced Per-Doctype)
// ============================================================================

interface PendingWrite {
  doctype: string
  updates: Partial<UserSettings>
  timer: NodeJS.Timeout
}

class UserSettingsService {
  private pendingWrites: Map<string, PendingWrite> = new Map()
  private debounceMs: number = 1000  // 1 second debounce (Desk-like)
  
  /**
   * Get user settings for a DocType
   * 
   * Official API: frappe.model.utils.user_settings.get
   */
  async get(doctype: string): Promise<UserSettings> {
    try {
      const result = await call('frappe.model.utils.user_settings.get', {
        doctype
      })
      
      // Parse response (can be JSON string or object)
      return parseUserSettings(result.message)
    } catch (error: any) {
      console.error(`[UserSettings.get] Error for ${doctype}:`, error)
      return {}
    }
  }
  
  /**
   * Save user settings (debounced)
   * 
   * Queues the update and debounces writes per doctype.
   * This matches Desk behavior: settings are saved after user stops interacting.
   * 
   * Official API: frappe.model.utils.user_settings.save
   * 
   * @param doctype - DocType name
   * @param updates - Partial settings to merge
   * @param immediate - Skip debounce (for critical saves like navigation)
   */
  async save(
    doctype: string,
    updates: Partial<UserSettings>,
    immediate: boolean = false
  ): Promise<void> {
    // Clear existing timer for this doctype
    const existing = this.pendingWrites.get(doctype)
    if (existing) {
      clearTimeout(existing.timer)
    }
    
    // Merge with pending updates (if any)
    const mergedUpdates = existing
      ? mergeSettings(existing.updates, updates)
      : updates
    
    // If immediate, execute now
    if (immediate) {
      await this.executeSave(doctype, mergedUpdates)
      this.pendingWrites.delete(doctype)
      return
    }
    
    // Otherwise, debounce
    const timer = setTimeout(() => {
      this.executeSave(doctype, mergedUpdates).finally(() => {
        this.pendingWrites.delete(doctype)
      })
    }, this.debounceMs)
    
    this.pendingWrites.set(doctype, {
      doctype,
      updates: mergedUpdates,
      timer
    })
  }
  
  /**
   * Execute the actual save call to Frappe
   */
  private async executeSave(
    doctype: string,
    updates: Partial<UserSettings>
  ): Promise<void> {
    try {
      // Frappe expects JSON string
      const settingsJson = serializeUserSettings(updates as UserSettings)
      
      await call('frappe.model.utils.user_settings.save', {
        doctype,
        user_settings: settingsJson
      })
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[UserSettings.save] Saved for ${doctype}:`, updates)
      }
    } catch (error: any) {
      console.error(`[UserSettings.save] Error for ${doctype}:`, error)
      throw error
    }
  }
  
  /**
   * Flush all pending writes immediately
   * 
   * Call this before navigation or on unmount if you need deterministic behavior.
   */
  async flush(): Promise<void> {
    const promises: Promise<void>[] = []
    
    for (const [doctype, pending] of this.pendingWrites.entries()) {
      clearTimeout(pending.timer)
      promises.push(
        this.executeSave(doctype, pending.updates).catch(err => {
          console.error(`[UserSettings.flush] Failed for ${doctype}:`, err)
        })
      )
    }
    
    this.pendingWrites.clear()
    await Promise.all(promises)
  }
  
  /**
   * Get pending write count (for diagnostics)
   */
  getPendingCount(): number {
    return this.pendingWrites.size
  }
  
  /**
   * Get pending writes (for diagnostics)
   */
  getPendingWrites(): Array<{ doctype: string; updates: Partial<UserSettings> }> {
    return Array.from(this.pendingWrites.values()).map(p => ({
      doctype: p.doctype,
      updates: p.updates
    }))
  }
}

// Singleton instance
export const userSettingsService = new UserSettingsService()

// Convenience exports
export const getUserSettings = (doctype: string) => userSettingsService.get(doctype)
export const saveUserSettings = (doctype: string, updates: Partial<UserSettings>, immediate?: boolean) => 
  userSettingsService.save(doctype, updates, immediate)
export const flushUserSettings = () => userSettingsService.flush()

