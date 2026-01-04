"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Trash2, Plus } from "lucide-react"
import { parseFrappeError } from "@/lib/utils/errors"
import {
  addPermissionRule,
  getPermissions,
  getRolesAndDocTypes,
  removePermissionRule,
  resetPermissions,
  updatePermissionRule,
  type PermissionRow,
} from "@/lib/api/permission-manager"

export function PermissionManagerPage({ doctype }: { doctype?: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [selectedDoctype, setSelectedDoctype] = React.useState<string>(doctype || "")
  const [selectedRole, setSelectedRole] = React.useState<string>("")
  const ALL_ROLES = "__all_roles__"

  React.useEffect(() => {
    if (doctype && doctype !== selectedDoctype) {
      setSelectedDoctype(doctype)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctype])

  const optionsQuery = useQuery({
    queryKey: ["permission-manager", "options"],
    queryFn: getRolesAndDocTypes,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const permsQuery = useQuery({
    queryKey: ["permission-manager", "permissions", selectedDoctype, selectedRole],
    queryFn: () => getPermissions({ doctype: selectedDoctype, role: selectedRole || undefined }),
    enabled: !!selectedDoctype,
    staleTime: 0,
    retry: 1,
  })

  const invalidatePerms = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["permission-manager", "permissions"] })
  }, [queryClient])

  const updateMutation = useMutation({
    mutationFn: updatePermissionRule,
    onSuccess: () => invalidatePerms(),
  })

  const addMutation = useMutation({
    mutationFn: addPermissionRule,
    onSuccess: () => invalidatePerms(),
  })

  const removeMutation = useMutation({
    mutationFn: removePermissionRule,
    onSuccess: () => invalidatePerms(),
  })

  const resetMutation = useMutation({
    mutationFn: resetPermissions,
    onSuccess: () => invalidatePerms(),
  })

  const columns: Array<{ key: keyof PermissionRow; label: string }> = [
    { key: "read", label: "Read" },
    { key: "write", label: "Write" },
    { key: "create", label: "Create" },
    { key: "delete", label: "Delete" },
    { key: "submit", label: "Submit" },
    { key: "cancel", label: "Cancel" },
    { key: "amend", label: "Amend" },
    { key: "print", label: "Print" },
    { key: "email", label: "Email" },
    { key: "report", label: "Report" },
    { key: "import", label: "Import" },
    { key: "export", label: "Export" },
    { key: "share", label: "Share" },
  ]

  const grouped = React.useMemo(() => {
    const rows = permsQuery.data || []
    const map = new Map<string, PermissionRow[]>()
    for (const r of rows) {
      const level = r.permlevel ?? 0
      const key = `${r.role}::${level}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push({ ...r, permlevel: level })
    }
    return Array.from(map.values()).map((arr) => arr[0])
  }, [permsQuery.data])

  const canToggle = React.useCallback((row: PermissionRow, field: keyof PermissionRow) => {
    const level = row.permlevel ?? 0
    if (field === "if_owner") return level === 0
    if (level > 0) return field === "read" || field === "write"
    if (!row.is_submittable && (field === "submit" || field === "cancel" || field === "amend")) return false
    if (!row.in_create && field === "create") return false
    if (row.if_owner && field === "report") return false
    return true
  }, [])

  const handleToggle = async (row: PermissionRow, field: keyof PermissionRow, checked: boolean) => {
    if (!selectedDoctype) return
    const permlevel = row.permlevel ?? 0
    const ifOwner = row.if_owner ? 1 : 0
    const value = checked ? "1" : "0"
    await updateMutation.mutateAsync({
      doctype: selectedDoctype,
      role: row.role,
      permlevel,
      ptype: String(field),
      value,
      if_owner: ifOwner,
    })
  }

  const handleAddRule = async () => {
    if (!selectedDoctype || !selectedRole) return
    await addMutation.mutateAsync({ parent: selectedDoctype, role: selectedRole, permlevel: 0 })
  }

  const handleRemoveRule = async (row: PermissionRow) => {
    if (!selectedDoctype) return
    await removeMutation.mutateAsync({
      doctype: selectedDoctype,
      role: row.role,
      permlevel: row.permlevel ?? 0,
      if_owner: row.if_owner ? 1 : 0,
    })
  }

  const handleReset = async () => {
    if (!selectedDoctype) return
    await resetMutation.mutateAsync(selectedDoctype)
  }

  const topError = optionsQuery.error || permsQuery.error || updateMutation.error || addMutation.error || removeMutation.error
  const parsedError = topError ? parseFrappeError(topError) : null

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Role Permissions Manager</h2>
            <p className="text-sm text-muted-foreground">
              Desk parity implementation using official Permission Manager APIs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!selectedDoctype || resetMutation.isPending}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/app/user-permission")}
            >
              Set User Permissions
            </Button>
          </div>
        </div>

        {parsedError ? (
          <div className="mt-4 flex items-start gap-3 text-red-600">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <div className="font-medium">{parsedError.title}</div>
              <div className="text-sm text-muted-foreground">{parsedError.message}</div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Document Type</div>
            <Select
              value={selectedDoctype}
              onValueChange={(v) => {
                setSelectedDoctype(v)
                setSelectedRole("")
                router.push(`/app/permission-manager/${encodeURIComponent(v)}`)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select DocType" />
              </SelectTrigger>
              <SelectContent>
                {(optionsQuery.data?.doctypes || []).map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Role (optional filter)</div>
            <Select
              value={selectedRole || ALL_ROLES}
              onValueChange={(v) => setSelectedRole(v === ALL_ROLES ? "" : v)}
              disabled={!selectedDoctype}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_ROLES}>All roles</SelectItem>
                {(optionsQuery.data?.roles || []).map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddRule}
              disabled={!selectedDoctype || !selectedRole || addMutation.isPending}
            >
              <Plus className="h-4 w-4" />
              Add Rule (Level 0)
            </Button>
          </div>
        </div>
      </Card>

      {selectedDoctype ? (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 w-[260px]">Role / Level</th>
                  <th className="text-left px-4 py-3 w-[140px]">Only if Creator</th>
                  {columns.map((c) => (
                    <th key={String(c.key)} className="text-center px-3 py-3 min-w-[90px]">
                      {c.label}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 w-[80px]"> </th>
                </tr>
              </thead>
              <tbody>
                {permsQuery.isLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={columns.length + 3}>
                      Loading permissions…
                    </td>
                  </tr>
                ) : grouped.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={columns.length + 3}>
                      No permission rules found.
                    </td>
                  </tr>
                ) : (
                  grouped.map((row) => {
                    const level = row.permlevel ?? 0
                    return (
                      <tr key={`${row.role}-${level}`} className="border-t">
                        <td className="px-4 py-3">
                          <div className="font-medium">{row.role}</div>
                          <div className="text-xs text-muted-foreground">Level {level}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={Boolean(row.if_owner)}
                              disabled={!canToggle(row, "if_owner") || updateMutation.isPending}
                              onCheckedChange={(next) => handleToggle(row, "if_owner", Boolean(next))}
                            />
                          </div>
                        </td>
                        {columns.map((c) => {
                          const checked = Boolean((row as any)[c.key])
                          const enabled = canToggle(row, c.key)
                          return (
                            <td key={String(c.key)} className="px-3 py-3 text-center">
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={checked}
                                  disabled={!enabled || updateMutation.isPending}
                                  onCheckedChange={(next) => handleToggle(row, c.key, Boolean(next))}
                                />
                              </div>
                            </td>
                          )
                        })}
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveRule(row)}
                            disabled={removeMutation.isPending}
                            aria-label="Remove rule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Select a DocType to manage permissions.</p>
        </Card>
      )}
    </div>
  )
}


