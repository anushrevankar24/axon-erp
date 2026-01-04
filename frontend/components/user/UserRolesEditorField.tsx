"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useWatch } from "react-hook-form"
import { call } from "@/lib/api/client"
import { RoleEditor } from "./RoleEditor"

type HasRoleRow = { doctype?: string; role: string }

export function UserRolesEditorField({
  form,
  baseDisabled,
}: {
  form: any
  baseDisabled: boolean
}) {
  const roleProfileName = useWatch({ control: form.control, name: "role_profile_name" }) as string | undefined
  const roles = (useWatch({ control: form.control, name: "roles" }) as HasRoleRow[] | undefined) || []

  const { data: profileRoles } = useQuery({
    queryKey: ["user", "role_profile", roleProfileName],
    queryFn: async () => {
      const res = await call("frappe.core.doctype.user.user.get_role_profile", {
        role_profile: roleProfileName,
      })
      return (res.message || res) as Array<{ role: string }>
    },
    enabled: !!roleProfileName,
    staleTime: 0,
    retry: 1,
  })

  const lastApplied = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!roleProfileName) {
      lastApplied.current = null
      return
    }
    if (!profileRoles) return
    if (lastApplied.current === roleProfileName) return

    // Desk parity: clear roles and populate from role profile
    const next = (profileRoles || []).map((r) => ({ doctype: "Has Role", role: r.role }))
    form.setValue("roles", next, { shouldDirty: true })
    lastApplied.current = roleProfileName
  }, [form, profileRoles, roleProfileName])

  // Desk parity: lock/unlock follows the live role_profile_name value
  const disabled = baseDisabled || Boolean(roleProfileName)

  return (
    <RoleEditor
      value={roles}
      onChange={(next) => form.setValue("roles", next, { shouldDirty: true })}
      disabled={disabled}
    />
  )
}


