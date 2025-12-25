"use client"

import Link from "next/link"
import { Home, ChevronRight } from "lucide-react"

interface ListBreadcrumbProps {
  module: string
  doctype: string
}

export function ListBreadcrumb({ module, doctype }: ListBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground bg-white border-b">
      <Link 
        href="/dashboard" 
        className="hover:text-foreground transition-colors flex items-center gap-1"
      >
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-3 w-3" />
      <Link 
        href="/dashboard" 
        className="hover:text-foreground transition-colors"
      >
        {module}
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground font-medium">{doctype}</span>
    </nav>
  )
}

