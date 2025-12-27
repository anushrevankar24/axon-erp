// Global type declarations for Frappe integration

declare global {
  interface Window {
    /**
     * CSRF token for Frappe API requests
     * The Frappe JS SDK automatically reads this and includes it in X-Frappe-CSRF-Token header
     * Pattern from: frappe-js-sdk/lib/utils/axios.js
     */
    csrf_token?: string
  }
}

export {}

