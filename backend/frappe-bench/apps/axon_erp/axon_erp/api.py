# Copyright (c) 2025, Axon Intelligence and contributors
# For license information, please see license.txt

"""
Custom API endpoints for Axon ERP frontend
These are thin wrappers around ERPNext functionality
Only includes APIs that ERPNext doesn't expose or need customization
"""

import frappe

@frappe.whitelist(allow_guest=True)
def get_boot():
    """
    Get boot session data for separate frontend
    
    This wrapper is REQUIRED because frappe.sessions.get() is an internal function,
    not a whitelisted API endpoint. ERPNext's own UI gets boot data embedded in HTML
    during server-side rendering, but separate frontends need an API endpoint.
    
    Security: Relies entirely on Frappe's internal security - no custom logic added.
    Pattern: Standard approach for Frappe mobile apps and third-party integrations.
    
    Note: allow_guest=True is required for initial page load before authentication.
    Guest users get minimal boot data (handled by frappe.sessions.get() internally).
    """
    # Call Frappe's internal sessions.get() - this is safe as it's server-side
    boot = frappe.sessions.get()
    return boot


@frappe.whitelist()
def get_csrf_token():
    """
    Get CSRF token for the current session
    
    Required for custom frontends that run on separate port/domain.
    ERPNext's default UI gets CSRF token from HTML template,
    but custom frontends need to fetch it via API.
    
    Returns:
        dict: {'csrf_token': str}
    """
    if not frappe.local.session.data.csrf_token:
        # Generate new token if doesn't exist
        frappe.local.session.data.csrf_token = frappe.generate_hash()
        if not frappe.flags.in_test:
            frappe.local.session_obj.update(force=True)
    
    return {
        'csrf_token': frappe.local.session.data.csrf_token
    }


# Future: Add your custom business logic APIs here
# Examples:
# - Industry-specific calculations
# - Custom reports
# - Workflow hooks
# - Integration APIs
