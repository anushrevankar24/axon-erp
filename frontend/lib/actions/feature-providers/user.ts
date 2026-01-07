/**
 * User Feature Provider
 * 
 * Provides DocType-specific actions for the User doctype.
 * Implements admin operations using official Frappe User APIs.
 * 
 * Based on: frappe/core/doctype/user/user.js
 */

import type { ActionProvider, Action, ActionContext } from '../types'
import { resetPassword, impersonateUser, generateAPIKeys } from '@/lib/api/user-admin'

/**
 * User feature provider
 * Adds User-specific admin actions
 */
export const userFeatureProvider: ActionProvider = {
  name: 'UserFeatureProvider',
  
  appliesTo: (doctype: string) => doctype === 'User',
  
  getActions: async (ctx: ActionContext): Promise<Action[]> => {
    const actions: Action[] = []
    const { doc } = ctx
    const isNew = !doc || doc.__islocal
    
    // Only add actions for existing users
    if (isNew) return actions
    
    // ========================================================================
    // PASSWORD ACTIONS
    // ========================================================================
    
    // Reset Password action
    actions.push({
      id: 'user-reset-password',
      label: 'Reset Password',
      group: 'actions',
      priority: 100,
      icon: 'Key',
      showAsMenuItem: true,
      requires: [
        { notNew: true },
        { 
          custom: (ctx) => {
            // Only System Manager or self can reset password
            // TODO: Check actual user roles from boot/context
            return true
          }
        }
      ],
      execute: async (ctx) => {
        const result = await resetPassword(ctx.doc.name)
        if (!result.success && result.error) {
          throw new Error(result.error.message)
        }
      }
    })
    
    // ========================================================================
    // IMPERSONATION
    // ========================================================================
    
    // Impersonate action (Administrator only)
    actions.push({
      id: 'user-impersonate',
      label: 'Impersonate',
      group: 'actions',
      priority: 101,
      icon: 'UserCog',
      showAsMenuItem: true,
      requires: [
        { notNew: true },
        { 
          custom: (ctx) => {
            // Only Administrator can impersonate
            // And cannot impersonate Administrator
            // TODO: Check if current user is Administrator from boot
            return ctx.doc.name !== 'Administrator'
          }
        }
      ],
      confirm: {
        message: 'You are about to impersonate this user. Please provide a reason.',
        title: 'Impersonate User',
        type: 'warning'
      },
      execute: async (ctx) => {
        // Prompt for reason
        const reason = prompt('Reason for impersonating (will be shared with user):')
        if (!reason) {
          throw new Error('Reason is required for impersonation')
        }
        
        const result = await impersonateUser(ctx.doc.name, reason)
        if (result.success) {
          // Reload page as impersonated user
          window.location.reload()
        } else if (result.error) {
          throw new Error(result.error.message)
        }
      }
    })
    
    // ========================================================================
    // PERMISSIONS SHORTCUTS
    // ========================================================================
    
    // View User Permissions action (navigates to User Permission list)
    actions.push({
      id: 'user-view-permissions',
      label: 'View Permissions',
      group: 'actions',
      priority: 102,
      icon: 'Shield',
      showAsMenuItem: true,
      requires: [
        { notNew: true }
      ],
      execute: async (ctx) => {
        if (ctx.navigate) {
          ctx.navigate(`/app/User Permission?user=${encodeURIComponent(ctx.doc.name)}`)
        }
      }
    })
    
    // View Permitted Documents action (navigates to report)
    actions.push({
      id: 'user-permitted-documents',
      label: 'Permitted Documents',
      group: 'actions',
      priority: 103,
      icon: 'FileCheck',
      showAsMenuItem: true,
      requires: [
        { notNew: true }
      ],
      execute: async (ctx) => {
        if (ctx.navigate) {
          ctx.navigate(`/app/query-report/Permitted Documents For User?user=${encodeURIComponent(ctx.doc.name)}`)
        }
      }
    })
    
    // ========================================================================
    // API KEY MANAGEMENT
    // ========================================================================
    
    // Generate API Keys action
    actions.push({
      id: 'user-generate-api-keys',
      label: 'Generate API Keys',
      group: 'actions',
      priority: 104,
      icon: 'Code',
      showAsMenuItem: true,
      requires: [
        { notNew: true },
        {
          custom: (ctx) => {
            // Only for users without existing keys or System Manager
            // TODO: Check if keys already exist
            return true
          }
        }
      ],
      confirm: {
        message: 'This will generate new API keys for this user. Existing keys (if any) will be invalidated.',
        title: 'Generate API Keys',
        type: 'warning'
      },
      execute: async (ctx) => {
        const result = await generateAPIKeys(ctx.doc.name)
        if (result.success) {
          // TODO: Show API key dialog with copy functionality
          alert(`API Key: ${result.api_key}\nAPI Secret: ${result.api_secret}\n\nPlease save these securely. The secret will not be shown again.`)
          
          // Reload to reflect changes
          if (ctx.refetch) {
            await ctx.refetch()
          }
        } else if (result.error) {
          throw new Error(result.error.message)
        }
      }
    })
    
    return actions
  }
}

