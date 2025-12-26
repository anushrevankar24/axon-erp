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
  
  // Request interceptor - add CSRF token
  frappe.axios.interceptors.request.use(
    (config) => {
      // Add CSRF token for state-changing requests
      if (config.method?.toLowerCase() === 'post' || config.method?.toLowerCase() === 'put' || config.method?.toLowerCase() === 'delete') {
        // Get CSRF token from cookie
        const csrfToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('csrf_token='))
          ?.split('=')[1]
        
        if (csrfToken) {
          config.headers['X-Frappe-CSRF-Token'] = csrfToken
        } else {
          console.warn('[API] No CSRF token found in cookies')
        }
      }
      
      return config
    },
    (error) => {
      console.error('[API] Request error:', error.message)
      return Promise.reject(error)
    }
  )
  
  // Response interceptor - handle errors (ERPNext pattern)
  frappe.axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status
      const url = error.config?.url || ''
      
      // ============================================
      // HANDLE SESSION EXPIRY (ERPNext Pattern)
      // Pattern from: frappe/request.js statusCode[401] and statusCode[403]
      // ============================================
      if (status === 401 || status === 403) {
        // Don't redirect if we're already on login page or calling login/logout
        const isAuthEndpoint = url.includes('/login') || url.includes('/logout')
        const isLoginPage = typeof window !== 'undefined' && 
                           window.location.pathname.includes('/login')
        
        if (!isAuthEndpoint && !isLoginPage) {
          console.warn('[API] Session expired (401/403) - redirecting to login')
          
          // Clear CSRF token (it's tied to the expired session)
          if (typeof document !== 'undefined') {
            document.cookie = 'csrf_token=; Max-Age=0; path=/'
          }
          
          // Show loading overlay before redirect (better UX)
          if (typeof window !== 'undefined') {
            const overlay = document.createElement('div')
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
        console.error('[API] Network error - offline or server unreachable')
        return Promise.reject(new Error('Network error'))
      }
      
      // ============================================
      // LOG OTHER ERRORS (Keep existing logic)
      // ============================================
      const isOptionalFeature = 
        url.includes('assign_to.get') ||
        url.includes('tags.get') ||
        url.includes('get_communications') ||
        url.includes('get_docinfo')
      
      if (!isOptionalFeature || (status && status !== 404 && status !== 403)) {
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
