"use client"

import * as React from "react"
import { UnifiedHeader } from "@/components/layout/UnifiedHeader"

interface ListViewLayoutProps {
  doctype: string
  children: React.ReactNode
}

export function ListViewLayout({ doctype, children }: ListViewLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Unified Header */}
      <UnifiedHeader />
      
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  )
}

