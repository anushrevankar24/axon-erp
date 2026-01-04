"use client"

import * as React from "react"
import { useWatch } from "react-hook-form"
import { RoleEditor } from "@/components/user/RoleEditor"

type HasRoleRow = { doctype?: string; role: string }

export function RoleProfileRolesEditorField({
  form,
  disabled,
}: {
  form: any
  disabled: boolean
}) {
  const roles = (useWatch({ control: form.control, name: "roles" }) as HasRoleRow[] | undefined) || []

  return (
    <RoleEditor
      value={roles}
      onChange={(next) => form.setValue("roles", next, { shouldDirty: true })}
      disabled={disabled}
    />
  )
}


