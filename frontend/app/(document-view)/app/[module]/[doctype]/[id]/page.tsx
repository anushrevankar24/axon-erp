'use client'

import { useParams } from 'next/navigation'
import { DocumentLayout } from '@/components/document/DocumentLayout'

export default function DocTypeDetailPage() {
  const params = useParams()
  const doctype = decodeURIComponent(params.doctype as string)
  const id = decodeURIComponent(params.id as string)
  
  return (
    <DocumentLayout 
      doctype={doctype} 
      id={id === 'new' ? undefined : id} 
    />
  )
}

