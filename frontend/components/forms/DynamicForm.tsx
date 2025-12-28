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
import { useRouter } from 'next/navigation'
import { useMeta, useDoc } from '@/lib/api/hooks'
import { saveDocument } from '@/lib/api/document'
import { FormLayoutRenderer } from './FormLayoutRenderer'
import { scrollToField } from './FieldRenderer'
import { Form } from '@/components/ui/form'
import { FormSkeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { checkMandatory, formatValidationErrors } from '@/lib/utils/validation'
import { slugify } from '@/lib/utils/workspace'
import { useMessageDialog } from '@/components/ui/message-dialog'

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
  const { data: meta, isLoading: metaLoading } = useMeta(doctype)
  const { data: doc, isLoading: docLoading } = useDoc(doctype, id)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { showError } = useMessageDialog()
  
  // Determine if this is a new document
  const isNew = !id || id === 'new'
  
  // Initialize form with proper default values to avoid uncontrolled input warnings
  const form = useForm({
    values: doc || {},
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
  
  const onSubmit = React.useCallback(async (data: any) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      // ========================================
      // Step 1: Client-side mandatory validation
      // ========================================
      // Same pattern as frappe.ui.form.check_mandatory in save.js
      if (meta) {
        const validationResult = checkMandatory(meta, data, form)
        
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
      const result = await saveDocument(docToSave, 'Save')
      
      if (result.success && result.doc) {
        // Success!
        toast.success(`${doctype} ${isNew ? 'created' : 'updated'} successfully`, {
          duration: 3000,
        })
        
        // Reset form dirty state
        form.reset(result.doc)
        
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
  }, [doctype, id, isNew, meta, form, router, onSaveSuccess, onSaveError, isSubmitting])

  // ============================================================================
  // Expose form methods to parent
  // ============================================================================
  
  React.useEffect(() => {
    if (onFormReady) {
      onFormReady({
        handleSubmit: () => form.handleSubmit(onSubmit)(),
        isDirty: form.formState.isDirty,
        isSubmitting,
      })
    }
  }, [onFormReady, form, onSubmit, isSubmitting])
  
  // ============================================================================
  // Render
  // ============================================================================
  
  if (metaLoading || (id && id !== 'new' && docLoading)) {
    return <FormSkeleton />
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
          onSubmit={form.handleSubmit(onSubmit)} 
          className="space-y-3"
          noValidate // We handle validation ourselves
        >
          <FormLayoutRenderer fields={meta.fields || []} form={form} />
        </form>
      </Form>
    </div>
  )
}

// ============================================================================
// Export Additional Utilities
// ============================================================================

export { scrollToField } from './FieldRenderer'
