"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { getDashboardData } from "@/lib/api/dashboard"
import Link from "next/link"

interface FormDashboardProps {
  doctype: string
  docname: string
}

export function FormDashboard({ doctype, docname }: FormDashboardProps) {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', doctype, docname],
    queryFn: () => getDashboardData(doctype, docname),
    enabled: !!docname && docname !== 'new'
  })

  if (!docname || docname === 'new') return null
  if (isLoading) {
    return (
      <div className="px-3 py-2 border-b bg-muted/10">
        <div className="animate-pulse">
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  const transactions = dashboardData?.transactions || []
  
  if (transactions.length === 0) return null

  return (
    <div className="px-6 py-4 border-b bg-muted/10">
      <div className="space-y-3">
        {transactions.map((section: any, idx: number) => (
          <div key={idx}>
            {section.label && (
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {section.label}
              </h4>
            )}
            <div className="flex flex-wrap gap-2">
              {section.items?.map((item: string, itemIdx: number) => (
                <ConnectionLink
                  key={itemIdx}
                  doctype={item}
                  parentDoctype={doctype}
                  parentDocname={docname}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ConnectionLink({ 
  doctype, 
  parentDoctype, 
  parentDocname 
}: { 
  doctype: string
  parentDoctype: string
  parentDocname: string
}) {
  const [showNewBtn, setShowNewBtn] = React.useState(false)
  // In real implementation, fetch count from API
  const count = 0 // TODO: Fetch actual count via useQuery

  return (
    <div 
      className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-muted/50 transition-colors"
      onMouseEnter={() => setShowNewBtn(true)}
      onMouseLeave={() => setShowNewBtn(false)}
    >
      <Link 
        href={`/app/list/${doctype}?${parentDoctype.toLowerCase()}=${parentDocname}`}
        className="flex items-center gap-2"
      >
        <span className="text-sm font-medium hover:text-primary transition-colors">
          {doctype}
        </span>
        
        {count > 0 && (
          <Badge variant="secondary" className="h-5 text-xs px-2">
            {count}
          </Badge>
        )}
      </Link>
      
      {showNewBtn && (
        <Link href={`/app/${doctype}/new`}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            title={`New ${doctype}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </Link>
      )}
    </div>
  )
}

