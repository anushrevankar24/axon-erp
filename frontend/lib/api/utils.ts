/**
 * Dynamically detect backend URL based on current hostname
 * This allows the same frontend code to work for all customer sites
 * Each customer will have their own domain name (e.g., customer1.axonerp.com)
 */
export function getBackendURL(): string {
  // Server-side rendering or build time
  if (typeof window === 'undefined') {
    // In SSR, we need the environment variable or it will fail
    const url = process.env.NEXT_PUBLIC_ERPNEXT_URL
    if (!url) {
      throw new Error('NEXT_PUBLIC_ERPNEXT_URL must be set for server-side rendering')
    }
    console.log('[API Utils] Server-side backend URL:', url)
    return url
  }
  
  // Client-side: detect from current URL
  const { protocol, hostname } = window.location
  
  // Production mode: Nginx proxies /api to backend on same URL
  if (process.env.NODE_ENV === 'production') {
    // In production, backend is accessible via same domain
    // Nginx routes /api/* to ERPNext backend
    const url = `${protocol}//${hostname}`
    console.log('[API Utils] Production backend URL:', url)
    return url
  }
  
  // Development mode: Backend runs on port 8000
  // Frontend on port 3000, backend on port 8000
  // Same hostname, different port
  const url = `${protocol}//${hostname}:8000`
  console.log('[API Utils] Development backend URL:', url)
  return url
}

/**
 * Get the site name from current hostname
 * Used for multi-site routing
 * Each customer has their own hostname/domain
 */
export function getCurrentSiteName(): string {
  if (typeof window === 'undefined') {
    // In SSR, get from environment or throw error
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME
    if (!siteName) {
      throw new Error('NEXT_PUBLIC_SITE_NAME must be set for server-side rendering')
    }
    return siteName
  }
  
  return window.location.hostname
}

/**
 * Get CSRF token from cookies
 * Frappe sets this after login
 */
export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') {
    return null
  }
  
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1]
  
  console.log('[CSRF] Token from cookie:', csrfToken ? 'Found' : 'Not found')
  return csrfToken || null
}

