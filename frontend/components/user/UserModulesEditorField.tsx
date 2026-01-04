"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useWatch } from "react-hook-form"
import { call } from "@/lib/api/client"
import { ModuleEditor } from "./ModuleEditor"

type BlockModuleRow = { doctype?: string; module: string }

export function UserModulesEditorField({
  form,
  allModules,
  baseDisabled,
}: {
  form: any
  allModules: string[]
  baseDisabled: boolean
}) {
  const moduleProfile = useWatch({ control: form.control, name: "module_profile" }) as string | undefined
  const blockModules =
    (useWatch({ control: form.control, name: "block_modules" }) as BlockModuleRow[] | undefined) || []

  const { data: profileBlockModules } = useQuery({
    queryKey: ["user", "module_profile", moduleProfile],
    queryFn: async () => {
      const res = await call("frappe.core.doctype.user.user.get_module_profile", {
        module_profile: moduleProfile,
      })
      return (res.message || res) as Array<{ module: string }>
    },
    enabled: !!moduleProfile,
    staleTime: 0,
    retry: 1,
  })

  const lastApplied = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!moduleProfile) {
      lastApplied.current = null
      return
    }
    if (!profileBlockModules) return
    if (lastApplied.current === moduleProfile) return

    // Desk parity: set block_modules from profile
    const next = (profileBlockModules || []).map((m) => ({ doctype: "Block Module", module: m.module }))
    form.setValue("block_modules", next, { shouldDirty: true })
    lastApplied.current = moduleProfile
  }, [form, moduleProfile, profileBlockModules])

  // Desk parity: lock/unlock follows the live module_profile value
  const disabled = baseDisabled || Boolean(moduleProfile)

  return (
    <ModuleEditor
      allModules={allModules}
      value={blockModules}
      onChange={(next) => form.setValue("block_modules", next, { shouldDirty: true })}
      disabled={disabled}
    />
  )
}


