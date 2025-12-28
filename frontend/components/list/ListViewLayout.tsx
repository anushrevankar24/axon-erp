"use client"

import * as React from "react"
import { UnifiedHeader } from "@/components/layout/UnifiedHeader"

interface ListViewLayoutProps {
  doctype: string
  children: React.ReactNode
}

export function ListViewLayout({ doctype, children }: ListViewLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Unified Header */}
      <UnifiedHeader />
      
      {/* Main content area - body handles scrolling */}
      <div className="flex-1 flex">
        {children}
      </div>
    </div>
  )
}

