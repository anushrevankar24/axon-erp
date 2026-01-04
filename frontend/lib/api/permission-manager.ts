"use client"

import { call } from "@/lib/api/client"

// Official Frappe endpoints for Permission Manager (Desk Page)
const BASE = "frappe.core.page.permission_manager.permission_manager"

export interface OptionItem {
  label: string
  value: string
}

export interface RolesAndDocTypes {
  doctypes: OptionItem[]
  roles: OptionItem[]
}

export type PermissionRow = {
  parent?: string
  role: string
  permlevel: number
  if_owner?: number | 0 | 1
  read?: number | 0 | 1
  write?: number | 0 | 1
  create?: number | 0 | 1
  delete?: number | 0 | 1
  submit?: number | 0 | 1
  cancel?: number | 0 | 1
  amend?: number | 0 | 1
  print?: number | 0 | 1
  email?: number | 0 | 1
  report?: number | 0 | 1
  import?: number | 0 | 1
  export?: number | 0 | 1
  share?: number | 0 | 1
  is_submittable?: number | 0 | 1
  in_create?: number | 0 | 1
  linked_doctypes?: any
}

export async function getRolesAndDocTypes(): Promise<RolesAndDocTypes> {
  const res = await call(`${BASE}.get_roles_and_doctypes`)
  return (res.message || res) as RolesAndDocTypes
}

export async function getPermissions(params: {
  doctype?: string
  role?: string
}): Promise<PermissionRow[]> {
  const res = await call(`${BASE}.get_permissions`, params)
  return (res.message || res) as PermissionRow[]
}

export async function addPermissionRule(params: {
  parent: string
  role: string
  permlevel: number
}) {
  return call(`${BASE}.add`, params)
}

export async function updatePermissionRule(params: {
  doctype: string
  role: string
  permlevel: number
  ptype: string
  value?: string | number | null
  if_owner?: number | 0 | 1
}) {
  return call(`${BASE}.update`, params)
}

export async function removePermissionRule(params: {
  doctype: string
  role: string
  permlevel: number
  if_owner?: number | 0 | 1
}) {
  return call(`${BASE}.remove`, params)
}

export async function resetPermissions(doctype: string) {
  return call(`${BASE}.reset`, { doctype })
}

export async function getStandardPermissions(doctype: string) {
  const res = await call(`${BASE}.get_standard_permissions`, { doctype })
  return res.message || res
}

export async function getUsersWithRole(role: string) {
  const res = await call(`${BASE}.get_users_with_role`, { role })
  return res.message || res
}


