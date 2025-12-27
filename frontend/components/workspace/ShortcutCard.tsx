'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { getWorkspaceIcon } from '@/lib/utils/icons'
import type { WorkspaceShortcut } from '@/lib/types/workspace'

interface ShortcutCardProps {
  shortcut: WorkspaceShortcut
  workspaceModule?: string
}

export function ShortcutCard({ shortcut, workspaceModule }: ShortcutCardProps) {
  const Icon = getWorkspaceIcon(shortcut.icon || shortcut.type.toLowerCase())
  
  const getHref = () => {
    if (shortcut.type === 'URL') return shortcut.url || '#'
    if (shortcut.type === 'DocType') {
      // ERPNext pattern: Direct DocType route
      return `/app/${shortcut.link_to}`
    }
    if (shortcut.type === 'Report') {
      return `/app/query-report/${shortcut.link_to}`
    }
    if (shortcut.type === 'Dashboard') {
      return `/app/dashboard-view/${shortcut.link_to}`
    }
    if (shortcut.type === 'Page') {
      return `/app/${shortcut.link_to}`
    }
    return '#'
  }

  const Component = shortcut.type === 'URL' ? 'a' : Link

  return (
    <Component
      href={getHref()}
      target={shortcut.type === 'URL' ? '_blank' : undefined}
      rel={shortcut.type === 'URL' ? 'noopener noreferrer' : undefined}
    >
      <Card className="p-4 hover:shadow-md transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center group">
        <div className="mb-2 p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm font-medium">{shortcut.label}</p>
      </Card>
    </Component>
  )
}

