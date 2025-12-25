'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useMeta, useDoc } from '@/lib/api/hooks'
import { db } from '@/lib/api/client'
import { FieldRenderer } from './FieldRenderer'
import { Form } from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

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
      // Extract meaningful error message from Frappe SDK response
      const errorMessage = error.exception || error._server_messages || error.message || 'Operation failed'
      toast.error(errorMessage)
    }
  }
  
  if (metaLoading || (id && docLoading)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!meta) {
    return <div>DocType not found</div>
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meta.fields?.map((field: any) => (
                !field.hidden && field.fieldtype !== 'Section Break' && field.fieldtype !== 'Column Break' && (
                  <FieldRenderer 
                    key={field.fieldname}
                    field={field}
                    form={form}
                  />
                )
              ))}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

