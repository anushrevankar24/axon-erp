/**
 * User Settings Service - Exact Desk Parity
 * 
 * Mirrors frappe/public/js/frappe/model/user_settings.js behavior:
 * - In-memory cache per doctype (like frappe.model.user_settings[doctype])
 * - Deep merge on save (Desk uses $.extend(true, ...))
 * - JSON-compare before POST (don't save if unchanged)
 * - Desk save signature: save(doctype, key, value)
 * 
 * Uses only official Frappe APIs:
 * - frappe.model.utils.user_settings.get
 * - frappe.model.utils.user_settings.save
 */

import { call } from '@/lib/api/client'
import { parseUserSettings, serializeUserSettings } from './normalize'
import { type UserSettings } from './schema'

// ============================================================================
// Deep merge utility (matches jQuery's $.extend(true, ...))
// ============================================================================

/**
 * Deep merge objects (recursive)
 * Matches Desk's $.extend(true, target, source) behavior
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  
  for (const key in source) {
    const sourceValue = source[key]
    const targetValue = result[key]
    
    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
        targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
      // Both are objects: deep merge
      result[key] = deepMerge(targetValue, sourceValue)
    } else {
      // Primitive, array, or null: direct assignment
      result[key] = sourceValue as any
    }
  }
  
  return result
}

// ============================================================================
// Debounced write queue (optional, per-doctype)
// ============================================================================

interface PendingWrite {
  doctype: string
  timer: NodeJS.Timeout
}

class UserSettingsService {
  // In-memory cache (like frappe.model.user_settings[doctype])
  private settingsCache: Map<string, UserSettings> = new Map()
  
  // Debounced write queue
  private pendingWrites: Map<string, PendingWrite> = new Map()
  private debounceMs: number = 500  // 500ms debounce
  
  /**
   * Get user settings for a DocType
   * 
   * Returns cached settings if available, otherwise fetches from server.
   * Matches Desk: frappe.get_user_settings(doctype)
   * 
   * Official API: frappe.model.utils.user_settings.get
   */
  async get(doctype: string): Promise<UserSettings> {
    // Return from cache if available
    if (this.settingsCache.has(doctype)) {
      return this.settingsCache.get(doctype)!
    }
    
    // Fetch from server
    try {
      const result = await call('frappe.model.utils.user_settings.get', {
        doctype
      })
      
      // Parse response (can be JSON string or object)
      const settings = parseUserSettings(result.message)
      
      // Cache it
      this.settingsCache.set(doctype, settings)
      
      return settings
    } catch (error: any) {
      console.error(`[UserSettings.get] Error for ${doctype}:`, error)
      const emptySettings = {}
      this.settingsCache.set(doctype, emptySettings)
      return emptySettings
    }
  }
  
  /**
   * Get settings synchronously from cache (if available)
   * Returns undefined if not yet cached.
   */
  getCached(doctype: string): UserSettings | undefined {
    return this.settingsCache.get(doctype)
  }
  
  /**
   * Save user settings (Desk signature)
   * 
   * Matches Desk: frappe.model.user_settings.save(doctype, key, value)
   * - If value is object: deep merge into settings[key]
   * - If value is primitive/null: set directly
   * - Compares JSON before POST (don't save if unchanged)
   * - Updates in-memory cache immediately
   * - Debounces the POST to avoid storms
   * 
   * Official API: frappe.model.utils.user_settings.save
   * 
   * @param doctype - DocType name
   * @param key - Settings key (e.g., "List", "Form", "GridView")
   * @param value - Value to save (object, primitive, or null)
   */
  async save(doctype: string, key: string, value: any): Promise<UserSettings> {
    // Ensure we have current settings in cache
    if (!this.settingsCache.has(doctype)) {
      await this.get(doctype)
    }
    
    const oldSettings = this.settingsCache.get(doctype)!
    const newSettings = { ...oldSettings }
    
    // Desk behavior: if value is object, merge into existing key object
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const existingValue = newSettings[key]
      if (existingValue && typeof existingValue === 'object' && !Array.isArray(existingValue)) {
        // Deep merge
        newSettings[key] = deepMerge(existingValue, value)
      } else {
        // Replace
        newSettings[key] = value
      }
    } else {
      // Primitive or null: direct assignment
      newSettings[key] = value
    }
    
    // JSON-compare: don't POST if unchanged (Desk behavior)
    const oldJson = JSON.stringify(oldSettings)
    const newJson = JSON.stringify(newSettings)
    
    if (oldJson === newJson) {
      // No change, skip POST
      return newSettings
    }
    
    // Update cache immediately (Desk behavior)
    this.settingsCache.set(doctype, newSettings)
    
    // Debounce the POST
    this.debouncedPost(doctype, newSettings)
    
    return newSettings
  }
  
  /**
   * Debounce the POST to server
   * Clears any existing timer for this doctype and sets a new one
   */
  private debouncedPost(doctype: string, settings: UserSettings): void {
    // Clear existing timer
    const existing = this.pendingWrites.get(doctype)
    if (existing) {
      clearTimeout(existing.timer)
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.executePost(doctype, settings).finally(() => {
        this.pendingWrites.delete(doctype)
      })
    }, this.debounceMs)
    
    this.pendingWrites.set(doctype, { doctype, timer })
  }
  
  /**
   * Execute the actual POST to Frappe
   * Posts the full settings object (not just updates)
   */
  private async executePost(doctype: string, settings: UserSettings): Promise<void> {
    try {
      // Frappe expects JSON string
      const settingsJson = serializeUserSettings(settings)
      
      await call('frappe.model.utils.user_settings.save', {
        doctype,
        user_settings: settingsJson
      })
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
      
      // Get current cached settings and POST them
      const settings = this.settingsCache.get(doctype)
      if (settings) {
        promises.push(
          this.executePost(doctype, settings).catch(err => {
            console.error(`[UserSettings.flush] Failed for ${doctype}:`, err)
          })
        )
      }
    }
    
    this.pendingWrites.clear()
    await Promise.all(promises)
  }
  
  /**
   * Update cache with external settings (e.g., from getdoctype response)
   * This allows us to pre-populate the cache without fetching
   */
  updateCache(doctype: string, settings: UserSettings): void {
    this.settingsCache.set(doctype, settings)
  }
  
  /**
   * Clear cache for a doctype (force refetch on next get)
   */
  clearCache(doctype?: string): void {
    if (doctype) {
      this.settingsCache.delete(doctype)
    } else {
      this.settingsCache.clear()
    }
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
  getPendingWrites(): Array<{ doctype: string }> {
    return Array.from(this.pendingWrites.values()).map(p => ({
      doctype: p.doctype
    }))
  }
  
  /**
   * Get all cached settings (for diagnostics)
   */
  getAllCached(): Record<string, UserSettings> {
    const result: Record<string, UserSettings> = {}
    for (const [doctype, settings] of this.settingsCache.entries()) {
      result[doctype] = settings
    }
    return result
  }
}

// Singleton instance
export const userSettingsService = new UserSettingsService()

// Convenience exports (Desk-style)
export const getUserSettings = (doctype: string) => userSettingsService.get(doctype)
export const saveUserSettings = (doctype: string, key: string, value: any) => 
  userSettingsService.save(doctype, key, value)
export const flushUserSettings = () => userSettingsService.flush()
export const getCachedUserSettings = (doctype: string) => userSettingsService.getCached(doctype)
export const updateUserSettingsCache = (doctype: string, settings: UserSettings) => 
  userSettingsService.updateCache(doctype, settings)


