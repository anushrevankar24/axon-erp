import { FrappeApp } from 'frappe-js-sdk'
import { getBackendURL } from './utils'
// (debug logging removed after root cause verification)

/**
 * Frappe SDK Configuration
 * 
 * Architecture:
 * - Empty string for baseURL = same-origin requests
 * - All API calls use relative URLs (/api/method/...)
 * - Nginx proxies /api/* to backend (ERPNext on port 8000)
 * - No CORS issues, no environment variables needed
 */
export const frappe = new FrappeApp(
  getBackendURL(),  // Returns empty string for relative URLs
  {
    useToken: false,
    // frappe-js-sdk requires a token type in its typings; for cookie-auth we don't use it,
    // but we keep a valid value for type safety.
    type: 'token'
  }
)

// Enable credentials for cookie-based authentication
if (frappe.axios) {
  frappe.axios.defaults.withCredentials = true
  
  // Initialize CSRF token from sessionStorage on app load (per-tab persistence)
  // This restores the token after page refresh within the same tab
  if (typeof window !== 'undefined') {
    const storedToken = sessionStorage.getItem('frappe_csrf_token')
    if (storedToken) {
      window.csrf_token = storedToken
    }
  }

  // Helper to check if the browser is still logged in (cookie session still valid).
  // This is used to distinguish true session expiry vs normal 403 PermissionError.
  let lastAuthCheckAt = 0
  let lastLoggedUser: string | null = null
  let authCheckInFlight: Promise<string | null> | null = null
  const getLoggedUser = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null

    const now = Date.now()
    // Throttle checks to avoid spamming server on bursts of 403s
    if (authCheckInFlight) return authCheckInFlight
    if (now - lastAuthCheckAt < 2000) return lastLoggedUser

    authCheckInFlight = (async () => {
      try {
        lastAuthCheckAt = Date.now()
        const res = await fetch('/api/method/frappe.auth.get_logged_user', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        })
        if (!res.ok) return null
        const data = await res.json()
        lastLoggedUser = data?.message ?? null
        return lastLoggedUser
      } catch {
        return null
      } finally {
        authCheckInFlight = null
      }
    })()

    return authCheckInFlight
  }
  
  // Note: The Frappe JS SDK has built-in CSRF handling in its axios interceptor
  // It automatically reads from window.csrf_token and sets X-Frappe-CSRF-Token header
  // See: frappe-js-sdk/lib/utils/axios.js lines 23-33
  // We don't need a custom interceptor - just keep window.csrf_token populated!
  
  // Response interceptor - handle errors (ERPNext pattern)
  frappe.axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error.response?.status
      const url = error.config?.url || ''
      // ============================================
      // HANDLE CSRF TOKEN EXPIRY/MISMATCH
      // ============================================
      if (status === 400 && error.response?.data?.exc_type === 'CSRFTokenError') {
        // Clear stale token
        delete window.csrf_token
        sessionStorage.removeItem('frappe_csrf_token')
        
        // Always attempt to fetch a fresh token; if session is gone, backend returns 401/403
        // Note: Do NOT check for sid cookie (it's HttpOnly in Frappe)
        if (!url.includes('/login')) {
          try {
            const response = await fetch('/api/method/axon_erp.api.get_csrf_token', {
              method: 'GET',
              credentials: 'include',
              headers: { 'Accept': 'application/json' }
            })
            
            if (response.ok) {
              const data = await response.json()
              const newToken = data.message?.csrf_token
              
              if (newToken) {
                // Store new token (memory + per-tab sessionStorage)
                window.csrf_token = newToken
                sessionStorage.setItem('frappe_csrf_token', newToken)
                // Retry the original request once
                return frappe.axios.request(error.config)
              }
            }
          } catch (refreshError) {
            console.error('[CSRF] Token refresh failed:', refreshError)
            // Fall through to session expiry handling
          }
        }
      }
      
      // ============================================
      // HANDLE SESSION EXPIRY (ERPNext Pattern)
      // Pattern from: frappe/request.js statusCode[401] and statusCode[403]
      // ============================================
      if (status === 401 || status === 403) {
        const excType = error.response?.data?.exc_type
        // Don't redirect if we're already on login page or calling login/logout
        const isAuthEndpoint = url.includes('/login') || url.includes('/logout')
        const isLoginPage = typeof window !== 'undefined' && 
                           (window.location.pathname.includes('/login') || 
                            window.location.pathname.includes('/setup'))
        
        // Don't treat optional feature 403s as session expiry
        // These endpoints may return 403 due to role permissions, not session expiry
        const isOptionalFeature = 
          url.includes('assign_to.get') ||
          url.includes('tags.get') ||
          url.includes('get_communications') ||
          url.includes('get_docinfo')
        
        // Prevent infinite loops - check if we're already redirecting
        const isAlreadyRedirecting = typeof document !== 'undefined' && 
                                      document.querySelector('[data-session-redirect]')
        
        // Only redirect on REAL session expiry, not permission denied for optional features
        if (!isAuthEndpoint && !isLoginPage && !isAlreadyRedirecting && !isOptionalFeature) {
          // Many Frappe endpoints return 403 for normal permission errors (not session expiry).
          // If backend explicitly says PermissionError, do NOT redirect.
          if (status === 403 && excType === 'PermissionError') {
            return Promise.reject(error)
          }

          // If still logged in (cookie session valid), this 401/403 is not session expiry.
          // This avoids redirecting users to login due to ordinary permission issues.
          const loggedUser = await getLoggedUser()
          if (loggedUser && loggedUser !== 'Guest') {
            return Promise.reject(error)
          }

          // Clear CSRF token (it's tied to the expired session)
          if (typeof window !== 'undefined') {
            delete window.csrf_token
          }
          sessionStorage.removeItem('frappe_csrf_token')
          
          // Show loading overlay before redirect (better UX)
          if (typeof window !== 'undefined') {
            const overlay = document.createElement('div')
            overlay.setAttribute('data-session-redirect', 'true')
            overlay.innerHTML = '<div style="text-align:center"><div style="font-size:18px;margin-bottom:10px">Session Expired</div><div>Redirecting to login...</div></div>'
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);color:white;display:flex;align-items:center;justify-content:center;z-index:9999;font-family:system-ui,-apple-system,sans-serif'
            document.body.appendChild(overlay)
            
            // Redirect after showing message
            setTimeout(() => {
              const returnUrl = encodeURIComponent(
                window.location.pathname + window.location.search
              )
              window.location.href = `/login?redirect=${returnUrl}`
            }, 500)
          }
          
          return Promise.reject(new Error('Session expired'))
        }
      }
      
      // ============================================
      // HANDLE NETWORK ERRORS
      // ============================================
      if (!error.response) {
        return Promise.reject(new Error('Network error'))
      }
      
      // ============================================
      // LOG ERRORS (ERPNext Pattern)
      // Pattern from: frappe/request.js cleanup() function
      // ============================================
      const isOptionalFeature = 
        url.includes('assign_to.get') ||
        url.includes('tags.get') ||
        url.includes('get_communications') ||
        url.includes('get_docinfo')
      
      // Don't log expected errors: validation (417), permissions (403), not found (404), conflicts (409)
      const isBootPermissionError = url.includes('get_boot') && (status === 403 || status === 401)
      const shouldSkipLogging = isOptionalFeature || 
                                 isBootPermissionError || 
                                 status === 404 || 
                                 status === 403 || 
                                 status === 417 ||
                                 status === 409  // Duplicate/Conflict errors
      
      // Match ERPNext: Only log exception traceback (r.exc)
      if (!shouldSkipLogging && status && status >= 400) {
        const responseData = error.response?.data
        if (responseData?.exc) {
          try {
            const exc = JSON.parse(responseData.exc)
            if (Array.isArray(exc)) {
              exc.forEach(e => e && console.error(e))
            } else {
              console.error(exc)
            }
          } catch {
            // If exc parsing fails, try exception field
            if (responseData.exception) {
              console.error(responseData.exception)
            }
          }
        }
      }
      
      return Promise.reject(error)
    }
  )
}

export const db = frappe.db()
export const frappeCall = frappe.call()
export const auth = frappe.auth()

// Single-flight CSRF token fetch to avoid startup races (Desk already has token embedded).
let csrfEnsureInFlight: Promise<void> | null = null
async function ensureCSRFToken(): Promise<void> {
  if (typeof window === 'undefined') return
  const hasToken = !!(window as any).csrf_token || !!sessionStorage.getItem('frappe_csrf_token')
  if (hasToken) return
  if (csrfEnsureInFlight) return csrfEnsureInFlight

  csrfEnsureInFlight = (async () => {
    try {
      const response = await fetch('/api/method/axon_erp.api.get_csrf_token', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      })
      if (!response.ok) return
      const data = await response.json()
      const newToken = data?.message?.csrf_token
      if (newToken) {
        ;(window as any).csrf_token = newToken
        sessionStorage.setItem('frappe_csrf_token', newToken)
      }
    } finally {
      csrfEnsureInFlight = null
    }
  })()

  return csrfEnsureInFlight
}

// Helper function to call Frappe methods
export const call = async (method: string, params?: any) => {
  const isAuthMethod = method === 'login' || method === 'logout'
  if (!isAuthMethod) {
    await ensureCSRFToken()
  }
  return frappeCall.post(method, params)
}
