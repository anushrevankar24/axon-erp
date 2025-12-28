/**
 * useFieldPermissions Hook
 * 
 * Calculates and provides field-level permissions for forms
 * Based on user roles, field permlevels, and document state
 */

import { useMemo } from 'react'
import { useBoot } from '@/lib/api/hooks'
import { DocTypeMeta } from '@/lib/types/metadata'
import { calculatePermissions, getFieldDisplayStatus, evaluateDependsOn } from '@/lib/utils/field-permissions'

export function useFieldPermissions(meta: DocTypeMeta | undefined, doc: any) {
  const { data: boot } = useBoot()
  
  const permissions = useMemo(() => {
    if (!meta || !boot?.user?.roles) {
      return {}
    }
    return calculatePermissions(meta, boot.user.roles)
  }, [meta, boot?.user?.roles])
  
  const getFieldStatus = useMemo(() => {
    return (fieldname: string) => {
      if (!meta) return 'None'
      
      const field = meta.fields.find(f => f.fieldname === fieldname)
      if (!field) return 'None'
      
      // Check depends_on first
      if (evaluateDependsOn(field, doc)) {
        return 'None'
      }
      
      return getFieldDisplayStatus(field, doc, permissions)
    }
  }, [meta, doc, permissions])
  
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

