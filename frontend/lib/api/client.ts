import { FrappeApp } from 'frappe-js-sdk'
import { getBackendURL } from './utils'

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
    type: 'browser'
  }
)

// Enable credentials for cookie-based authentication
if (frappe.axios) {
  frappe.axios.defaults.withCredentials = true
  
  // Initialize CSRF token from localStorage on app load
  // This restores the token after page refresh
  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('frappe_csrf_token')
    if (storedToken) {
      window.csrf_token = storedToken
    }
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
        localStorage.removeItem('frappe_csrf_token')
        
        // Try to fetch new token (only if we have a session)
        const hasSid = typeof document !== 'undefined' && 
                      document.cookie.split('; ').some(row => row.startsWith('sid='))
        
        if (hasSid && !url.includes('/login')) {
          try {
            const response = await fetch('/api/method/axon_erp.api.get_csrf_token', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            })
            
            if (response.ok) {
              const data = await response.json()
              const newToken = data.message?.csrf_token
              
              if (newToken) {
                // Store new token
                window.csrf_token = newToken
                localStorage.setItem('frappe_csrf_token', newToken)
                
                // Retry the original request
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
          // Clear CSRF token (it's tied to the expired session)
          if (typeof window !== 'undefined') {
            delete window.csrf_token
          }
          localStorage.removeItem('frappe_csrf_token')
          
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
      // LOG IMPORTANT ERRORS ONLY
      // ============================================
      const isOptionalFeature = 
        url.includes('assign_to.get') ||
        url.includes('tags.get') ||
        url.includes('get_communications') ||
        url.includes('get_docinfo')
      
      // Don't log expected errors: optional features, validation errors (417), permission errors on boot when logged out
      const isBootPermissionError = url.includes('get_boot') && (status === 403 || status === 401)
      const shouldSkipLogging = isOptionalFeature || 
                                 isBootPermissionError || 
                                 status === 404 || 
                                 status === 403 || 
                                 status === 417
      
      if (!shouldSkipLogging && status && status >= 400) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('[API ERROR]')
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('URL:', url)
        console.error('Method:', error.config?.method?.toUpperCase())
        console.error('Status:', status)
        console.error('Error Message:', error.message)
        
        const responseData = error.response?.data
        if (responseData) {
          console.error('Response Data:', responseData)
          if (responseData.exception) {
            console.error('Exception:', responseData.exception)
          }
          if (responseData._server_messages) {
            try {
              const messages = JSON.parse(responseData._server_messages)
              console.error('Server Messages:', messages)
            } catch {
              console.error('Server Messages (raw):', responseData._server_messages)
            }
          }
        }
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      }
      
      return Promise.reject(error)
    }
  )
}

export const db = frappe.db()
export const frappeCall = frappe.call()
export const auth = frappe.auth()

// Helper function to call Frappe methods
export const call = async (method: string, params?: any) => {
  return frappeCall.post(method, params)
}
