/**
 * Form Actions Component
 * 
 * Renders action buttons with permission-based visibility
 * Implements ERPNext's button logic for Save, Submit, Cancel, Delete
 */

import { Button } from '@/components/ui/button'
import { usePermissions } from '@/lib/auth/usePermissions'
import { useBoot } from '@/lib/api/hooks'
import { DocTypeMeta } from '@/lib/types/metadata'

interface FormActionsProps {
  doctype: string
  doc: any
  meta: DocTypeMeta
  onSave: () => void
  onSubmit?: () => void
  onCancel?: () => void
  onDelete?: () => void
}

export function FormActions({
  doctype,
  doc,
  meta,
  onSave,
  onSubmit,
  onCancel,
  onDelete
}: FormActionsProps) {
  const { has_perm } = usePermissions()
  const { data: boot } = useBoot()
  
  const isNew = doc.__islocal
  const isSubmitted = doc.docstatus === 1
  const isCancelled = doc.docstatus === 2
  
  // Check permissions
  const canWrite = has_perm(doctype, 'write')
  const canSubmit = has_perm(doctype, 'submit') && meta.is_submittable
  const canCancel = has_perm(doctype, 'cancel') && meta.is_submittable
  const canDelete = has_perm(doctype, 'delete')
  
  // Check ownership for if_owner permissions
  const isOwner = doc.owner === boot?.user?.name
  
  return (
    <div className="flex gap-2">
      {/* Save button - show for new or if user can write */}
      {(isNew || (canWrite && !isSubmitted)) && (
        <Button onClick={onSave}>
          {isNew ? 'Create' : 'Save'}
        </Button>
      )}
      
      {/* Submit button - show for saved documents if submittable */}
      {!isNew && !isSubmitted && canSubmit && onSubmit && (
        <Button onClick={onSubmit} variant="default">
          Submit
        </Button>
      )}
      
      {/* Cancel button - show for submitted documents */}
      {isSubmitted && !isCancelled && canCancel && onCancel && (
        <Button onClick={onCancel} variant="destructive">
          Cancel
        </Button>
      )}
      
      {/* Delete button */}
      {!isNew && canDelete && !isSubmitted && onDelete && (
        <Button onClick={onDelete} variant="outline">
          Delete
        </Button>
      )}
    </div>
  )
}

