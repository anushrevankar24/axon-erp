/**
 * User Administration API - Official Frappe User Management Methods
 * 
 * Provides wrappers around frappe.core.doctype.user.user.* methods
 * for user management operations (reset password, impersonate, generate keys, etc.)
 * 
 * Based on: frappe/core/doctype/user/user.py
 */

import { call } from './client'
import { parseFrappeError, type FrappeError } from '@/lib/utils/errors'

/**
 * Reset password for a user
 * Sends password reset email to the user
 * 
 * Calls frappe.core.doctype.user.user.reset_password
 * 
 * @param user - User email/name
 */
export async function resetPassword(
  user: string
): Promise<{ success: boolean; message?: string; error?: FrappeError }> {
  try {
    const result = await call('frappe.core.doctype.user.user.reset_password', {
      user
    })
    
    return {
      success: true,
      message: result.message || 'Password reset email sent'
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Impersonate a user (Administrator only)
 * Allows Administrator to login as another user
 * 
 * Calls frappe.core.doctype.user.user.impersonate
 * 
 * @param user - User email to impersonate
 * @param reason - Reason for impersonation (logged and shown to user)
 */
export async function impersonateUser(
  user: string,
  reason: string
): Promise<{ success: boolean; error?: FrappeError }> {
  try {
    await call('frappe.core.doctype.user.user.impersonate', {
      user,
      reason
    })
    
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Generate API keys for a user
 * Creates API key and secret for programmatic access
 * 
 * Calls frappe.core.doctype.user.user.generate_keys
 * 
 * @param user - User email
 */
export async function generateAPIKeys(
  user: string
): Promise<{ success: boolean; api_key?: string; api_secret?: string; error?: FrappeError }> {
  try {
    const result = await call('frappe.core.doctype.user.user.generate_keys', {
      user
    })
    
    return {
      success: true,
      api_key: result.message?.api_key,
      api_secret: result.message?.api_secret
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Get roles for a user
 * 
 * Calls frappe.core.doctype.user.user.get_roles
 * 
 * @param user - User email
 */
export async function getUserRoles(
  user: string
): Promise<{ success: boolean; roles?: string[]; error?: FrappeError }> {
  try {
    const result = await call('frappe.core.doctype.user.user.get_roles', {
      uid: user
    })
    
    return {
      success: true,
      roles: result.message || []
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Check if user has email account setup
 * 
 * Calls frappe.core.doctype.user.user.has_email_account
 * 
 * @param user - User email
 */
export async function hasEmailAccount(
  user: string
): Promise<{ success: boolean; hasAccount?: boolean; error?: FrappeError }> {
  try {
    const result = await call('frappe.core.doctype.user.user.has_email_account', {
      user
    })
    
    return {
      success: true,
      hasAccount: !!result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Get timezones list
 * 
 * Calls frappe.core.doctype.user.user.get_timezones
 */
export async function getTimezones(): Promise<{ success: boolean; timezones?: string[]; error?: FrappeError }> {
  try {
    const result = await call('frappe.core.doctype.user.user.get_timezones')
    
    return {
      success: true,
      timezones: result.message?.timezones || []
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

