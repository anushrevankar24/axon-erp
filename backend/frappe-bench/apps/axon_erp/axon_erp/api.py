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
    Get boot info for custom frontend
    
    Wraps Frappe's existing frappe.sessions.get() function and adds all DocTypes.
    This provides the same data ERPNext's own frontend receives on login.
    
    Note: allow_guest=True allows unauthenticated calls (returns Guest boot)
    This is needed for separate frontend architecture where app loads before login check
    
    Returns:
        dict: Boot info including:
            - user: Current user info
            - modules: All modules
            - permissions: User permissions
            - all_doctypes: All DocTypes (our addition for navigation)
            - And 70+ other fields from ERPNext
    """
    # If Guest user (not logged in), return minimal boot
    # No CSRF token required for Guest users
    if frappe.session.user == 'Guest':
        return {
            'user': 'Guest',
            'all_doctypes': [],
            'modules': {},
            'message': 'Guest session - please login'
        }
    
    # Get standard boot info from Frappe (same data ERPNext UI gets)
    boot = frappe.sessions.get()
    
    # Add all DocTypes for sidebar navigation
    # Using frappe.get_all() which bypasses the 20-item REST API limit
    boot['all_doctypes'] = frappe.get_all(
        'DocType',
        filters={
            'istable': 0,  # Exclude child tables
            'issingle': 0   # Exclude single DocTypes (Settings pages)
        },
        fields=['name', 'module', 'icon', 'custom'],
        order_by='name',
        limit=0  # No limit - fetch all DocTypes
    )
    
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
