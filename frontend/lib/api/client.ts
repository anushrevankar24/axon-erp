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
  
  // Response interceptor - handle errors
  frappe.axios.interceptors.response.use(
    (response) => {
      // Success - no logging needed
      return response
    },
    (error) => {
      // Only log unexpected errors (not 404s for optional data)
      const status = error.response?.status
      const url = error.config?.url || ''
      
      // Don't log errors for optional sidebar features
      const isOptionalFeature = 
        url.includes('assign_to.get') ||
        url.includes('tags.get') ||
        url.includes('get_communications') ||
        url.includes('get_docinfo')
      
      if (!isOptionalFeature || (status && status !== 404 && status !== 403)) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('[API ERROR]')
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('URL:', error.config?.url)
        console.error('Method:', error.config?.method?.toUpperCase())
        console.error('Status:', error.response?.status)
        console.error('Request Data:', error.config?.data ? JSON.parse(error.config.data) : 'none')
        console.error('Error Message:', error.message)
        
        // ERPNext specific error details
        const responseData = error.response?.data
        if (responseData) {
          console.error('Response Data:', responseData)
          
          if (responseData.exception) {
            console.error('Exception:', responseData.exception)
          }
          if (responseData.exc_type) {
            console.error('Exception Type:', responseData.exc_type)
          }
          if (responseData._server_messages) {
            try {
              const messages = JSON.parse(responseData._server_messages)
              console.error('Server Messages:', messages)
            } catch {
              console.error('Server Messages (raw):', responseData._server_messages)
            }
          }
          if (responseData.exc) {
            console.error('Full Traceback:', responseData.exc)
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
