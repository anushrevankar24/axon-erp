'use client'

import Link from 'next/link'
import { FileText, BarChart3, Layout } from 'lucide-react'
import type { WorkspaceLink } from '@/lib/types/workspace'

interface LinkItemProps {
  link: WorkspaceLink
  workspaceModule?: string
}

export function LinkItem({ link, workspaceModule }: LinkItemProps) {
  const getIcon = () => {
    if (link.link_type === 'Report') return <BarChart3 className="w-4 h-4" />
    if (link.link_type === 'Page') return <Layout className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const getHref = () => {
    // ERPNext pattern: Direct DocType routes
    if (link.link_type === 'DocType') {
      return `/app/${link.link_to}`
    }
    if (link.link_type === 'Report') {
      return link.is_query_report 
        ? `/app/query-report/${link.link_to}`
        : `/app/report/${link.link_to}`
    }
    if (link.link_type === 'Page') {
      return `/app/${link.link_to}`
    }
    return '#'
  }

  return (
    <Link
      href={getHref()}
      className="flex items-center gap-2 px-3 py-2 rounded hover:bg-accent transition-colors text-sm group"
    >
      <span className="text-muted-foreground group-hover:text-foreground transition-colors">
        {getIcon()}
      </span>
      <span className="flex-1">{link.label}</span>
      {link.is_query_report === 1 && (
        <span className="text-xs text-muted-foreground">Query Report</span>
      )}
      {link.onboard === 1 && (
        <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
          Setup
        </span>
      )}
    </Link>
  )
}

