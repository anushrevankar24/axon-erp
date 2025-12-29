# Copyright (c) 2025, Axon Intelligence and contributors
# For license information, please see license.txt

"""
Custom API endpoints for Axon ERP frontend
These are thin wrappers around ERPNext functionality
Only includes APIs that ERPNext doesn't expose or need customization
"""

import frappe
from frappe import _

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


@frappe.whitelist()
def get_new_doc(doctype, with_mandatory_children=False):
    """
    Get a new document with all defaults applied.
    
    This is the official way to create new documents for external frontends.
    Replicates what ERPNext's frappe.model.get_new_doc() does client-side.
    
    Uses frappe.new_doc() which handles:
    - User-specific defaults from User Defaults
    - Permission-filtered defaults
    - Global system defaults
    - Special values (Today, __user, Now, :User)
    - Field-based defaults
    - Select field first option defaults
    
    Based on:
    - frappe/__init__.py: frappe.new_doc()
    - frappe/model/create_new.py: get_new_doc(), make_new_doc()
    - frappe/public/js/frappe/model/create_new.js: frappe.model.get_new_doc()
    
    Args:
        doctype (str): DocType name
        with_mandatory_children (bool): Create empty rows for required child tables
    
    Returns:
        dict: New document with all defaults applied
    """
    # Check permissions
    if not frappe.has_permission(doctype, "create"):
        frappe.throw(_("No permission to create {0}").format(doctype), frappe.PermissionError)
    
    # Use Frappe's official function - handles ALL default value complexity
    doc = frappe.new_doc(doctype)
    
    # Run onload methods (important for dynamic field setup, custom scripts)
    doc.run_method('onload')
    
    # Optionally create mandatory child table rows
    if with_mandatory_children:
        meta = frappe.get_meta(doctype)
        for df in meta.fields:
            if df.fieldtype == "Table" and df.reqd:
                doc.append(df.fieldname, {})
    
    # Return as dictionary
    return doc.as_dict()


# Future: Add your custom business logic APIs here
# Examples:
# - Industry-specific calculations
# - Custom reports
# - Workflow hooks
# - Integration APIs
