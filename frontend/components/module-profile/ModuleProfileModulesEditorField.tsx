"use client"

import * as React from "react"
import { useWatch } from "react-hook-form"
import { ModuleEditor } from "@/components/user/ModuleEditor"

type BlockModuleRow = { doctype?: string; module: string }

export function ModuleProfileModulesEditorField({
  form,
  allModules,
  disabled,
}: {
  form: any
  allModules: string[]
  disabled: boolean
}) {
  const blockModules =
    (useWatch({ control: form.control, name: "block_modules" }) as BlockModuleRow[] | undefined) || []

  return (
    <ModuleEditor
      allModules={allModules}
      value={blockModules}
      onChange={(next) => form.setValue("block_modules", next, { shouldDirty: true })}
      disabled={disabled}
    />
  )
}


