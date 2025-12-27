'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useMeta, useDoc } from '@/lib/api/hooks'
import { db } from '@/lib/api/client'
import { FormLayoutRenderer } from './FormLayoutRenderer'
import { Form } from '@/components/ui/form'
import { FormSkeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { parseFrappeError } from '@/lib/utils/errors'

interface DynamicFormProps {
  doctype: string
  id?: string
  onFormReady?: (form: any) => void
  onDirtyChange?: (isDirty: boolean) => void
}

export function DynamicForm({ doctype, id, onFormReady, onDirtyChange }: DynamicFormProps) {
  const router = useRouter()
  const { data: meta, isLoading: metaLoading } = useMeta(doctype)
  const { data: doc, isLoading: docLoading } = useDoc(doctype, id)
  
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

  // Expose form methods to parent
  React.useEffect(() => {
    if (onFormReady) {
      onFormReady({
        handleSubmit: () => form.handleSubmit(onSubmit)()
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFormReady])
  
  const onSubmit = async (data: any) => {
    try {
      if (id && id !== 'new') {
        // Update existing document using Frappe SDK
        await db.updateDoc(doctype, id, data)
        toast.success(`${doctype} updated successfully`)
      } else {
        // Create new document using Frappe SDK
        const result = await db.createDoc(doctype, data)
        toast.success(`${doctype} created successfully`)
        router.push(`/app/${meta?.module}/${doctype}/${result.name}`)
      }
    } catch (error: any) {
      console.error('Save error:', error)
      // Parse error using ERPNext pattern
      const errorMessage = parseFrappeError(error)
      toast.error(errorMessage, {
        duration: 5000, // Show longer for user to read
      })
    }
  }
  
  if (metaLoading || (id && docLoading)) {
    return <FormSkeleton />
  }
  
  if (!meta) {
    return <div>DocType not found</div>
  }
  
  return (
    <div className="animate-in fade-in-50 duration-300">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormLayoutRenderer fields={meta.fields || []} form={form} />
        </form>
      </Form>
    </div>
  )
}

