'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { call } from '@/lib/api/client'
import { useBoot } from '@/lib/api/hooks'
import { setBoot as setFrappeRuntimeBoot, setDocFetcher } from '@/lib/frappe-runtime'

interface AuthContextType {
  user: any | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider - Manages authentication state
 * 
 * Uses useBoot() which calls axon_erp.api.get_boot()
 * This wraps frappe.sessions.get() - same data ERPNext frontend gets
 * 
 * Note: The wrapper is required because frappe.sessions.get() is an internal
 * function, not a whitelisted API. ERPNext's UI gets boot data embedded in HTML
 * during server-side rendering, but separate frontends need an API endpoint.
 * 
 * Pattern from: frappe/desk.js Application.load_bootinfo()
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: boot, isLoading, error } = useBoot()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Handle boot data - determine if user is authenticated
  useEffect(() => {
    if (boot) {
      // Initialize logic runtime with boot context (Desk gets this embedded).
      setFrappeRuntimeBoot(boot)
    }

    if (error) {
      const status = (error as any)?.response?.status
      // Session expired or unauthorized
      if (status === 401 || status === 403) {
        setIsAuthenticated(false)
        // Don't redirect if already on login/setup pages to prevent infinite loop
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/setup')) {
          router.push('/login')
        }
      }
    }
    
    // User is authenticated if boot has user and not Guest
    if (boot?.user && boot.user !== 'Guest') {
      setIsAuthenticated(true)
    } else if (boot?.user === 'Guest') {
      setIsAuthenticated(false)
    }
  }, [boot, error, router])

  // Provide a doc fetcher for runtime lazy lookups (e.g. Company/Currency in depends_on eval).
  useEffect(() => {
    setDocFetcher(async (doctype: string, name: string) => {
      const result = await call('frappe.client.get', { doctype, name })
      return result.message
    })
  }, [])
  
  /**
   * Logout - Call Frappe's logout API
   * Pattern from: frappe/desk.js (logout button)
   */
  const logout = useCallback(async () => {
    try {
      // Call Frappe's built-in logout method
      await call('logout')
    } catch (err) {
      // Continue anyway - clear client state
    } finally {
      // Clear authentication state
      setIsAuthenticated(false)
      
      // Clear CSRF token (Frappe SDK pattern)
      if (typeof window !== 'undefined') {
        delete window.csrf_token
      }
      localStorage.removeItem('frappe_csrf_token')
      
      // Redirect to login (full page reload to clear all state)
      window.location.href = '/login'
    }
  }, [])
  
  /**
   * Check Auth - Verify session is still valid
   * Pattern from: frappe.auth.get_logged_user
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const result = await call('frappe.auth.get_logged_user')
      const user = result.message
      const isAuth = user && user !== 'Guest'
      setIsAuthenticated(isAuth)
      return isAuth
    } catch {
      setIsAuthenticated(false)
      return false
    }
  }, [])
  
  return (
    <AuthContext.Provider value={{
      user: boot?.user || null,
      isLoading,
      isAuthenticated,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth Hook - Access auth context in components
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

