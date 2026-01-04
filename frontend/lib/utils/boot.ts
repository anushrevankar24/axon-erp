"use client"

/**
 * Desk-parity boot helpers.
 *
 * In ERPNext Desk:
 * - frappe.boot.user is an object (not a string)
 * - roles are at frappe.boot.user.roles
 * - identity is frappe.session.user (string); in our boot payload, use boot.user.name
 */

export function getBootUserObject(boot: any): any | null {
  const u = boot?.user
  if (u && typeof u === "object") return u
  return null
}

export function getBootUserId(boot: any): string {
  const u = boot?.user
  if (typeof u === "string") return u
  if (u && typeof u === "object") {
    if (typeof u.name === "string" && u.name) return u.name
    if (typeof u.email === "string" && u.email) return u.email
  }
  return ""
}

export function getBootUserRoles(boot: any): string[] {
  const u = getBootUserObject(boot)
  const roles = u?.roles
  return Array.isArray(roles) ? roles.filter((r) => typeof r === "string") : []
}

export function isGuest(boot: any): boolean {
  const id = getBootUserId(boot)
  return !id || id === "Guest"
}


