'use client'

import { use } from 'react'
import { useBoot } from '@/lib/api/hooks'
import { unslugify, decodeComponent } from '@/lib/utils/workspace'
import { DocumentLayout } from '@/components/document/DocumentLayout'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { FormSkeleton } from '@/components/ui/skeleton'

interface FormPageProps {
  params: Promise<{ route: string; id: string }>
}

/**
 * Form View Handler - ERPNext Pattern
 * Pattern from: frappe/router.js line 230-235
 * 
 * URL: /app/item/SKU005 → Form for Item SKU005
 * URL: /app/sales-order/SO-001 → Form for Sales Order SO-001
 * URL: /app/Sales%20Invoice/ACC-001 → Form for Sales Invoice (URL-encoded)
 */
export default function FormPage({ params }: FormPageProps) {
  const { route: routeSlug, id } = use(params)
  const decodedRoute = decodeComponent(routeSlug)  // Decode URL (ERPNext pattern)
  const decodedId = decodeComponent(id)             // Decode ID
  const { data: boot } = useBoot()
  
  if (!boot) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-7xl px-4">
          <FormSkeleton />
        </div>
      </div>
    )
  }
  
  // Convert slug to DocType name
  // "item" → "Item"
  // "sales-order" → "Sales Order"
  // "Sales Invoice" → "Sales Invoice" (already decoded)
  const doctype = unslugify(decodedRoute, boot)
  
  if (!doctype) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-semibold mb-2">DocType Not Found</h3>
        <p className="text-muted-foreground mb-4">
          "{routeSlug}" is not a valid DocType
        </p>
        <Link href="/app/home" className="text-primary hover:underline">
          Go to Home
        </Link>
      </Card>
    )
  }
  
  return <DocumentLayout doctype={doctype} id={decodedId} />
}

