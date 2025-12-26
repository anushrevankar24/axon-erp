/**
 * API utility functions for Axon ERP
 * 
 * Architecture:
 * - Local Dev: Nginx proxies requests from http://dev.axonerp.local/ to services
 * - Production: Nginx proxies requests from https://customer.erp.com/ to services
 * - Frontend always uses relative URLs (/api/*)
 * - Nginx routes /api/* to backend (port 8000)
 * - ERPNext resolves tenant from Host header
 */

/**
 * Get backend URL for API calls
 * 
 * Returns empty string to use relative URLs in all environments.
 * Nginx reverse proxy handles routing based on path:
 * - / → Frontend (port 3000)
 * - /api/* → Backend (port 8000)
 */
export function getBackendURL(): string {
  // Always return empty string for relative URLs
  // Nginx handles routing to correct service
  return ''
}

/**
 * Get the current site name from hostname
 * Used for multi-site routing in ERPNext
 * 
 * In production: customer1.erp.com → ERPNext loads customer1 site
 * In development: dev.axonerp.local → ERPNext loads dev site
 */
export function getCurrentSiteName(): string {
  if (typeof window !== 'undefined') {
    return window.location.hostname
  }
  
  // Server-side rendering: Cannot determine hostname
  // ERPNext will resolve from Host header sent by client
  return ''
}

/**
 * Get CSRF token from cookies
 * Frappe sets this after login for security
 */
export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') {
    return null
  }
  
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1]
  
  return csrfToken || null
}
