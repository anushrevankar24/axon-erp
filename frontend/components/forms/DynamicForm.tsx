'use client'

/**
 * Dynamic Form Component - ERPNext Pattern
 * 
 * Renders and handles document forms based on DocType metadata.
 * Uses Desk API for full validation and error handling.
 * 
 * Based on:
 * - frappe/public/js/frappe/form/form.js
 * - frappe/public/js/frappe/form/save.js
 */

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useMetaWithSettings, useDoc, useDocWithInfo } from '@/lib/api/hooks'
import { saveDocument, type SaveAction } from '@/lib/api/document'
import { 
  shouldUseQuickEntry, 
  getQuickEntryFields, 
  quickEntrySave, 
  quickEntrySubmit, 
  canQuickEntrySubmit 
} from '@/lib/api/quick-entry'
import { FormLayoutRenderer } from './FormLayoutRenderer'
import { QuickEntryInline } from './QuickEntryInline'
import { scrollToField } from './FieldRenderer'
import { Form } from '@/components/ui/form'
import { FormSkeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { checkMandatory, formatValidationErrors } from '@/lib/utils/validation'
import { slugify } from '@/lib/utils/workspace'
import { useMessageDialog } from '@/components/ui/message-dialog'
import { computeDependencyStateForMetaFields } from '@/lib/form/dependency_state'
import { useFrappeRuntimeVersion } from '@/lib/frappe-runtime/react'
import { applyDependencyOverrides } from '@/lib/utils/field-permissions'
import { showDeskAlert } from '@/lib/utils/desk-alert'

// ============================================================================
// Types
// ============================================================================

interface DynamicFormProps {
  doctype: string
  id?: string
  onFormReady?: (form: FormHandle) => void
  onDirtyChange?: (isDirty: boolean) => void
  onSaveSuccess?: (doc: any) => void
  onSaveError?: (error: any) => void
}

interface FormHandle {
  /**
   * Desk parity: toolbar delegates to form submit, passing action verb.
   * - 'Save' for normal save
   * - 'Submit' for submit
   * - 'Update' for update after submit (rare; Desk uses Update in some flows)
   */
  submit: (action?: SaveAction) => Promise<void>
  /**
   * Back-compat convenience: Save
   * (Some callers may still expect handleSubmit semantics)
   */
  handleSubmit: () => Promise<void>
  isDirty: boolean
  isSubmitting: boolean
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract field-specific error message from server response
 * Tries to find a specific message for a field from the error text
 */
function extractFieldError(errorMessage: string, fieldLabel: string): string | null {
  if (!errorMessage) return null
  
  // Pattern 1: "Field Name: error message"
  const colonPattern = new RegExp(`${fieldLabel}[:\\s]+([^<\n]+)`, 'i')
  const colonMatch = errorMessage.match(colonPattern)
  if (colonMatch) return colonMatch[1].trim()
  
  // Pattern 2: Field mentioned in sentence
  const sentencePattern = new RegExp(`([^.]+${fieldLabel}[^.]+\\.)`, 'i')
  const sentenceMatch = errorMessage.match(sentencePattern)
  if (sentenceMatch) return sentenceMatch[1].trim()
  
  return null
}

// ============================================================================
// Component
// ============================================================================

export function DynamicForm({ 
  doctype, 
  id, 
  onFormReady, 
  onDirtyChange,
  onSaveSuccess,
  onSaveError 
}: DynamicFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { data: metaWithSettings, isLoading: metaLoading } = useMetaWithSettings(doctype)
  
  // Determine if this is a new document
  const isNew = !id || id === 'new'
  
  // For existing docs, use useDocWithInfo to get docinfo.permissions (Desk parity)
  // For new docs, use useDoc (no docinfo available yet)
  const { data: docWithInfo, isLoading: docWithInfoLoading } = useDocWithInfo(doctype, id)
  const { data: newDoc, isLoading: newDocLoading } = useDoc(doctype, id)
  
  const doc = isNew ? newDoc : docWithInfo?.doc
  const docinfo = isNew ? null : docWithInfo?.docinfo
  const docLoading = isNew ? newDocLoading : docWithInfoLoading

  // Desk parity: Duplicate opens /new and carries a query param with a stored draft copy.
  // We hydrate that copy here to prefill the new document (no server call required beyond getNewDoc).
  const [duplicateDraft, setDuplicateDraft] = React.useState<any>(null)
  React.useEffect(() => {
    if (!isNew) return
    const sourceName = searchParams?.get('duplicate_from')
    if (!sourceName) return

    try {
      const key = `duplicate:${doctype}:${sourceName}`
      const raw = sessionStorage.getItem(key)
      if (!raw) return
      const parsed = JSON.parse(raw)
      // Clear after read to avoid stale reuse
      sessionStorage.removeItem(key)
      setDuplicateDraft(parsed)
    } catch (e) {
      console.warn('[Duplicate] Failed to hydrate duplicate draft:', e)
    }
  }, [isNew, doctype, searchParams])

  const effectiveDoc = isNew && duplicateDraft ? duplicateDraft : doc
  
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { showError } = useMessageDialog()
  const runtimeVersion = useFrappeRuntimeVersion()
  const debugForm = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    try {
      return new URLSearchParams(window.location.search).get('debug_form') === '1'
    } catch {
      return false
    }
  }, [])
  
  // Extract meta and user_settings
  const meta = metaWithSettings?.meta
  const userSettings = metaWithSettings?.user_settings
  
  // Quick Entry mode state
  const [showQuickEntry, setShowQuickEntry] = React.useState(false)

  // Dependency state (Desk refresh_dependency equivalent)
  const dependencyState = React.useMemo(() => {
    if (!meta || !effectiveDoc) return {}
    return computeDependencyStateForMetaFields(meta.fields || [], { doc: effectiveDoc, parent: effectiveDoc })
  }, [meta, effectiveDoc, runtimeVersion])

  const effectiveMeta = React.useMemo(() => {
    if (!meta) return meta
    const fields = (meta.fields || []).map((f: any) => applyDependencyOverrides(f, dependencyState[f.fieldname]))
    return { ...meta, fields }
  }, [meta, dependencyState])
  
  // Quick Entry eligibility check (matches quick_entry.js)
  const quickEntryInfo = React.useMemo(() => {
    if (!isNew || !meta || !effectiveMeta) {
      return { eligible: false, fields: [] }
    }
    
    // Check meta.quick_entry flag
    if (meta.quick_entry !== 1) {
      return { eligible: false, fields: [] }
    }
    
    // Get mandatory/quick-entry fields
    // Matches quick_entry.js: (df.reqd || df.allow_in_quick_entry) && !df.read_only && !df.is_virtual && df.fieldtype !== "Tab Break"
    const mandatoryFields = effectiveMeta.fields.filter((f: any) => 
      (f.reqd || f.allow_in_quick_entry) &&
      !f.read_only &&
      !f.is_virtual &&
      f.fieldtype !== 'Tab Break' &&
      !f.hidden &&
      !f.hidden_due_to_dependency
    )
    
    // Disqualify if has mandatory Table field
    const hasMandatoryTable = mandatoryFields.some((f: any) => f.fieldtype === 'Table')
    if (hasMandatoryTable) {
      return { eligible: false, fields: [] }
    }
    
    // Disqualify if too many mandatory fields (>7)
    if (mandatoryFields.length > 7) {
      return { eligible: false, fields: [] }
    }
    
    // Handle autoname === "prompt" (inject __newname field)
    let fields = [...mandatoryFields]
    if (meta.autoname && meta.autoname.toLowerCase() === 'prompt') {
      fields.unshift({
        fieldname: '__newname',
        fieldtype: 'Data',
        label: `${meta.name} Name`,
        reqd: 1,
        read_only: 0,
        hidden: 0
      })
    }
    
    // Dev logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[QuickEntry ${doctype}]`, {
        eligible: true,
        quickEntryFlag: meta.quick_entry,
        mandatoryFields: fields.length,
        fields: fields.map((f: any) => f.fieldname)
      })
    }
    
    return { eligible: true, fields }
  }, [isNew, meta, effectiveMeta, doctype])
  
  // Initialize quick entry mode if eligible
  React.useEffect(() => {
    if (quickEntryInfo.eligible && isNew) {
      setShowQuickEntry(true)
    }
  }, [quickEntryInfo.eligible, isNew])
  
  // Initialize form with proper default values to avoid uncontrolled input warnings
  const form = useForm({
    values: effectiveDoc || {},
    defaultValues: {},
  })

  // Track form dirty state
  React.useEffect(() => {
    if (onDirtyChange) {
      const subscription = form.watch(() => {
        onDirtyChange(form.formState.isDirty)
      })
      return () => subscription.unsubscribe()
    }
  }, [form, onDirtyChange])

  // ============================================================================
  // Form Submission Handler - ERPNext Pattern
  // ============================================================================
  
  const onSubmitWithAction = React.useCallback(async (data: any, action: SaveAction = 'Save') => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      // ========================================
      // Step 1: Client-side mandatory validation
      // ========================================
      // Same pattern as frappe.ui.form.check_mandatory in save.js
      if (effectiveMeta) {
        const validationResult = checkMandatory(effectiveMeta as any, data, form)
        
        if (!validationResult.valid) {
          // Format error message like ERPNext
          const { title, message } = formatValidationErrors(validationResult.errors, doctype)
          
          // Show error toast with field list
          toast.error(
            <div>
              <strong className="block mb-2">{title}</strong>
              <div dangerouslySetInnerHTML={{ __html: message }} />
            </div>,
            { duration: 6000 }
          )
          
          // Scroll to first error field
          if (validationResult.firstErrorField) {
            scrollToField(validationResult.firstErrorField)
          }
          
          setIsSubmitting(false)
          return
        }
      }
      
      // ========================================
      // Step 2: Prepare document for save
      // ========================================
      const docToSave = {
        doctype,
        ...data,
        // Set name for existing documents
        name: isNew ? undefined : id,
        // Mark as new document for Frappe
        __islocal: isNew ? 1 : undefined,
        // Mark as unsaved
        __unsaved: 1,
      }
      
      // ========================================
      // Step 3: Save via Desk API
      // ========================================
      // Uses frappe.desk.form.save.savedocs - same as ERPNext frontend
      const result = await saveDocument(docToSave, action)
      
      if (result.success && result.doc) {
        // Success!
        const actionVerb =
          action === 'Submit'
            ? 'submitted'
            : isNew
              ? 'created'
              : 'updated'

        showDeskAlert(`${doctype} ${actionVerb} successfully`, { indicator: 'green', duration: 3000 })
        
        // Reset form dirty state
        form.reset(result.doc)
        
        // Strict Desk parity: invalidate doc query so useDoc() refetches with saved state
        // This ensures doc.role_profile_name / doc.module_profile reflect saved values
        // which drives the strict disable timing for role/module editors
        queryClient.invalidateQueries({ queryKey: ['doc', doctype, result.doc.name] })
        
        // Call success callback
        onSaveSuccess?.(result.doc)
        
        // Navigate to saved document if new
        if (isNew && result.doc.name) {
          router.push(`/app/${slugify(doctype)}/${result.doc.name}`)
        }
      } else {
        // ========================================
        // Step 4: Enhanced Server Error Handling
        // ========================================
        const error = result.error
        
        if (error) {
          // 1. Use Message Dialog for blocking errors (validation/duplicate)
          //    Use Toast for non-blocking errors (permission/system)
          const isBlockingError = error.type === 'validation' || error.type === 'duplicate'
          
          if (isBlockingError) {
            // Show modal dialog (matches ERPNext msgprint pattern for blocking errors)
            showError(error)
          } else {
            // Show toast for permission/system errors (non-blocking)
            toast.error(
              <div>
                <strong className="block mb-1">{error.title}</strong>
                <span>{error.message}</span>
              </div>,
              { duration: 6000 }
            )
          }
          
          // 2. Enhanced field highlighting with inline error messages
          if (error.fields && error.fields.length > 0) {
            let firstErrorFieldname: string | null = null
            
            for (const fieldLabel of error.fields) {
              // Try to find fieldname from label
              const field = meta?.fields?.find(
                (f: any) => f.label === fieldLabel || f.fieldname === fieldLabel
              )
              
              if (field) {
                // Extract specific error message for this field from server response
                const fieldSpecificError = extractFieldError(error.message, field.label)
                
                form.setError(field.fieldname, {
                  type: 'server',
                  message: fieldSpecificError || `${field.label} is invalid`
                })
                
                if (!firstErrorFieldname) {
                  firstErrorFieldname = field.fieldname
                }
              }
            }
            
            // 3. Smooth scroll with visual pulse animation
            if (firstErrorFieldname) {
              scrollToField(firstErrorFieldname)
              
              // Add pulse animation to first error field
              setTimeout(() => {
                const element = document.querySelector(`[data-fieldname="${firstErrorFieldname}"]`)
                if (element) {
                  element.classList.add('animate-error-pulse')
                  setTimeout(() => element.classList.remove('animate-error-pulse'), 1000)
                }
              }, 300) // Delay for smooth scroll to complete
            }
          }
          
          // 4. Log for debugging (development only)
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Form Validation]', {
              doctype,
              errorType: error.type,
              fields: error.fields,
              action: 'save'
            })
          }
          
          // Call error callback
          onSaveError?.(error)
        }
      }
    } catch (error: any) {
      // Unexpected error
      console.error('Form submission error:', error)
      toast.error('An unexpected error occurred. Please try again.')
      onSaveError?.(error)
    } finally {
      setIsSubmitting(false)
    }
  }, [doctype, id, isNew, effectiveMeta, form, router, onSaveSuccess, onSaveError, isSubmitting])

  // Desk parity: expose a submit method that accepts the action verb.
  const submit = React.useCallback(
    async (action: SaveAction = 'Save') => {
      return await form.handleSubmit((data: any) => onSubmitWithAction(data, action))()
    },
    [form, onSubmitWithAction]
  )

  // ============================================================================
  // Expose form methods to parent
  // ============================================================================
  
  React.useEffect(() => {
    if (onFormReady) {
      onFormReady({
        submit,
        handleSubmit: () => submit('Save'),
        isDirty: form.formState.isDirty,
        isSubmitting,
      })
    }
  }, [onFormReady, form, submit, isSubmitting])
  
  // ============================================================================
  // Render
  // ============================================================================
  
  // IMPORTANT: Never render the form while the doc is still loading.
  // Desk always evaluates dependencies against an actual doc object.
  if (metaLoading || docLoading) {
    return <FormSkeleton />
  }

  if (debugForm) {
    // eslint-disable-next-line no-console
    console.groupCollapsed(`[debug_form] DynamicForm ${doctype} / ${id || ''}`)
    try {
      // eslint-disable-next-line no-console
      console.log('isNew:', isNew)
      // eslint-disable-next-line no-console
      console.log('doc.name:', doc?.name)
      // eslint-disable-next-line no-console
      console.log('meta.fields count:', (meta?.fields || []).length)
      // eslint-disable-next-line no-console
      console.log('tab breaks in meta:', (meta?.fields || []).filter((f: any) => f?.fieldtype === 'Tab Break').map((f: any) => ({ fieldname: f.fieldname, label: f.label, depends_on: f.depends_on, hidden: f.hidden, permlevel: f.permlevel })))
      // eslint-disable-next-line no-console
      console.log('docinfo.permissions:', docinfo?.permissions)
    } finally {
      // eslint-disable-next-line no-console
      console.groupEnd()
    }
  }
  
  if (!meta) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        DocType &quot;{doctype}&quot; not found
      </div>
    )
  }
  
  return (
    <div className="animate-in fade-in-50 duration-300">
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit((data: any) => onSubmitWithAction(data, 'Save'))} 
          className="space-y-3"
          noValidate // We handle validation ourselves
        >
          {/* Show Quick Entry for new docs if eligible */}
          {isNew && showQuickEntry && quickEntryInfo.eligible ? (
            <QuickEntryInline
              fields={quickEntryInfo.fields}
              form={form}
              doc={doc}
              meta={effectiveMeta}
              dependencyState={dependencyState}
              userSettings={userSettings}
              docinfo={docinfo}
              onEditFullForm={() => setShowQuickEntry(false)}
            />
          ) : (
            <FormLayoutRenderer
              fields={effectiveMeta.fields || []}
              form={form}
              doc={doc}
              meta={effectiveMeta}
              dependencyState={dependencyState}
              userSettings={userSettings}
              docinfo={docinfo}
            />
          )}
        </form>
      </Form>
    </div>
  )
}

// ============================================================================
// Export Additional Utilities
// ============================================================================

export { scrollToField } from './FieldRenderer'
