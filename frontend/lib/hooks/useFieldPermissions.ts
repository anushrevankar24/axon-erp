/**
 * useFieldPermissions Hook
 * 
 * Calculates and provides field-level permissions for forms
 * Based on user roles, field permlevels, and document state
 */

import { useMemo } from 'react'
import { useBoot } from '@/lib/api/hooks'
import { DocTypeMeta } from '@/lib/types/metadata'
import { calculatePermissions, getFieldDisplayStatus, evaluateDependsOn, applyDependencyOverrides } from '@/lib/utils/field-permissions'
import type { DependencyStateMap } from '@/lib/form/dependency_state'
import { getBootUserRoles } from '@/lib/utils/boot'

export function useFieldPermissions(meta: DocTypeMeta | undefined, doc: any, dependencyState?: DependencyStateMap, docinfo?: any) {
  const { data: boot } = useBoot()
  
  const permissions = useMemo(() => {
    const userRoles = getBootUserRoles(boot)
    if (!meta || userRoles.length === 0) {
      return {}
    }
    return calculatePermissions(meta, userRoles)
  }, [meta, boot])
  
  const getFieldStatus = useMemo(() => {
    return (fieldname: string) => {
      if (!meta) return 'None'
      
      const field = meta.fields.find(f => f.fieldname === fieldname)
      if (!field) return 'None'
      
      const effectiveField = applyDependencyOverrides(field as any, dependencyState?.[fieldname])

      // If dependencyState isn't provided, fall back to dynamic evaluation.
      if (!dependencyState && evaluateDependsOn(field as any, doc)) {
        return 'None'
      }
      
      // Desk parity: incorporate docinfo.permissions (doc-level permissions)
      return getFieldDisplayStatus(effectiveField as any, doc, permissions, docinfo)
    }
  }, [meta, doc, permissions, dependencyState, docinfo])
  
  return {
    permissions,
    getFieldStatus,
    canEdit: (fieldname: string) => getFieldStatus(fieldname) === 'Write',
    canRead: (fieldname: string) => {
      const status = getFieldStatus(fieldname)
      return status === 'Read' || status === 'Write'
    },
    isHidden: (fieldname: string) => getFieldStatus(fieldname) === 'None'
  }
}

