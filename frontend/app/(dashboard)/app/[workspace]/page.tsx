'use client'

import { use } from 'react'
import { useWorkspaceByName, useWorkspaceDetails } from '@/lib/api/workspace'
import { ShortcutGrid } from '@/components/workspace/ShortcutGrid'
import { LinkCardGrid } from '@/components/workspace/LinkCardGrid'
import { NumberCardGrid } from '@/components/workspace/NumberCardGrid'
import { WorkspaceSkeleton } from '@/components/workspace/WorkspaceSkeleton'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface WorkspacePageProps {
  params: Promise<{ workspace: string }>
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspace: workspaceName } = use(params)
  const decodedWorkspace = decodeURIComponent(workspaceName)
  
  const { workspace, error: workspaceError } = useWorkspaceByName(decodedWorkspace)
  const { data: details, isLoading, error } = useWorkspaceDetails(workspace)

  // Loading state
  if (isLoading || !workspace) {
    return <WorkspaceSkeleton />
  }

  // Error state
  if (error || workspaceError) {
    return (
      <Card className="p-8">
        <div className="flex items-start gap-4 text-red-600">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold mb-2">Error Loading Workspace</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error?.message || workspaceError?.message || 'Failed to load workspace content'}
            </p>
            <Link 
              href="/app/home"
              className="text-sm text-primary hover:underline"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Workspace Title */}
      <div>
        <h1 className="text-3xl font-bold">{workspace.title}</h1>
        <p className="text-muted-foreground mt-1">
          {workspace.module} Module
        </p>
      </div>

      {/* Number Cards (KPIs) */}
      {details?.number_cards && details.number_cards.items.length > 0 && (
        <NumberCardGrid cards={details.number_cards.items} />
      )}

      {/* Shortcuts */}
      {details?.shortcuts && details.shortcuts.items.length > 0 && (
        <ShortcutGrid 
          shortcuts={details.shortcuts.items}
          workspaceModule={workspace.module}
        />
      )}

      {/* Link Cards (Reports & Masters) */}
      {details?.cards && details.cards.items.length > 0 && (
        <LinkCardGrid 
          cards={details.cards.items}
          workspaceModule={workspace.module}
        />
      )}

      {/* Empty State */}
      {(!details?.cards?.items || details.cards.items.length === 0) && 
       (!details?.shortcuts?.items || details.shortcuts.items.length === 0) && 
       (!details?.number_cards?.items || details.number_cards.items.length === 0) && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            This workspace doesn't have any content configured yet.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Configure workspace content in ERPNext backend.
          </p>
        </Card>
      )}
    </div>
  )
}

