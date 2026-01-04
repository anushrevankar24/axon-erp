"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { call } from "@/lib/api/client"

type UserRoleRow = { role: string }

// Mirrors Frappe desk: frappe.perm.rights (common stable set)
const PERM_RIGHTS = [
  "read",
  "write",
  "create",
  "delete",
  "submit",
  "cancel",
  "amend",
  "report",
  "export",
  "import",
  "share",
  "print",
  "email",
] as const

type PermRight = (typeof PERM_RIGHTS)[number]

type PermInfoRow = {
  parent: string
  permlevel: number
  if_owner?: 0 | 1
} & Partial<Record<PermRight, 0 | 1>>

export interface RoleEditorProps {
  value: UserRoleRow[]
  onChange: (next: UserRoleRow[]) => void
  disabled?: boolean
}

export function RoleEditor({ value, onChange, disabled = false }: RoleEditorProps) {
  const { data: allRoles, isLoading } = useQuery({
    queryKey: ["user", "all_roles"],
    queryFn: async () => {
      const res = await call("frappe.core.doctype.user.user.get_all_roles")
      return (res.message || res) as string[]
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  const currentRoles = React.useMemo(() => new Set((value || []).map((r) => r.role)), [value])

  const toggleRole = React.useCallback(
    (role: string, checked: boolean) => {
      if (checked) {
        if (currentRoles.has(role)) return
        onChange([...(value || []), { doctype: "Has Role", role } as any])
      } else {
        onChange((value || []).filter((r) => r.role !== role))
      }
    },
    [currentRoles, onChange, value]
  )

  const selectAll = React.useCallback(() => {
    onChange((allRoles || []).map((role) => ({ doctype: "Has Role", role } as any)))
  }, [allRoles, onChange])

  const unselectAll = React.useCallback(() => {
    onChange([])
  }, [onChange])

  // Permissions dialog parity with Desk RoleEditor.show_permissions
  const [permDialogOpen, setPermDialogOpen] = React.useState(false)
  const [selectedRole, setSelectedRole] = React.useState<string | null>(null)

  const { data: permInfo, isLoading: permLoading } = useQuery({
    queryKey: ["user", "role_perm_info", selectedRole],
    queryFn: async () => {
      const res = await call("frappe.core.doctype.user.user.get_perm_info", { role: selectedRole })
      return (res.message || res) as PermInfoRow[]
    },
    enabled: !!selectedRole && permDialogOpen,
    staleTime: 0,
    retry: 1,
  })

  const effectiveRights = React.useMemo(() => {
    const rows = permInfo || []
    const present = new Set<PermRight>()
    for (const row of rows) {
      for (const r of PERM_RIGHTS) {
        if (row[r]) present.add(r)
      }
    }
    // Keep stable ordering like Desk; only show rights relevant to this role
    return PERM_RIGHTS.filter((r) => present.has(r))
  }, [permInfo])

  const openPermDialog = React.useCallback((role: string) => {
    setSelectedRole(role)
    setPermDialogOpen(true)
  }, [])

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-3">Loading roles...</div>
  }
  
  if (!allRoles || allRoles.length === 0) {
    return <div className="text-sm text-muted-foreground p-3">No roles available</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={selectAll} disabled={disabled}>
          Select All
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={unselectAll} disabled={disabled}>
          Unselect All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-3">
        {(allRoles || []).map((role) => {
          const checked = currentRoles.has(role)
          return (
            <div key={role} className="flex items-center gap-2">
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={(next) => toggleRole(role, Boolean(next))}
              />
              <button
                type="button"
                onClick={() => openPermDialog(role)}
                className="text-left text-sm hover:underline"
              >
                {role}
              </button>
            </div>
          )
        })}
      </div>

      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent className="max-w-[1200px]">
          <DialogHeader>
            <DialogTitle>{selectedRole || "Role Permissions"}</DialogTitle>
          </DialogHeader>

          {permLoading ? (
            <div className="text-sm text-muted-foreground">Loading permissions…</div>
          ) : !permInfo || permInfo.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              {selectedRole ? `${selectedRole} role does not have permission on any doctype` : "No data"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>If Owner</TableHead>
                  {effectiveRights.map((r) => (
                    <TableHead key={r}>{r}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permInfo.map((row, idx) => (
                  <TableRow key={`${row.parent}-${row.permlevel}-${idx}`}>
                    <TableCell>{row.parent}</TableCell>
                    <TableCell>{row.permlevel}</TableCell>
                    <TableCell>{row.if_owner ? "✓" : "-"}</TableCell>
                    {effectiveRights.map((r) => (
                      <TableCell key={r} className="text-muted-foreground font-semibold">
                        {row[r] ? "✓" : "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


