'use client'

import { useParams } from 'next/navigation'
import { ListViewLayout } from '@/components/list/ListViewLayout'
import { ListView } from '@/components/list/ListView'

export default function DocTypeListPage() {
  const params = useParams()
  const doctype = decodeURIComponent(params.doctype as string)
  
  return (
    <ListViewLayout doctype={doctype}>
      <ListView doctype={doctype} />
    </ListViewLayout>
  )
}

