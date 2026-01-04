'use client'

import { use } from 'react'
import { useBoot } from '@/lib/api/hooks'
import { slugify, unslugify, decodeComponent } from '@/lib/utils/workspace'
import { useWorkspaceDetails } from '@/lib/api/workspace'
import { ShortcutGrid, LinkCardGrid, NumberCardGrid, WorkspaceSkeleton } from '@/components/workspace'
import { ListView } from '@/components/list/ListView'
import { WorkspaceSidebar } from '@/components/layout/WorkspaceSidebar'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import type { Workspace } from '@/lib/types/workspace'
import { useResolvedPage } from '@/lib/pages/resolvePage'
import { getRegisteredPage } from '@/lib/pages/registry'

interface DynamicRouteProps {
  params: Promise<{ route: string }>
}

/**
 * Dynamic Route Handler - ERPNext Pattern
 * Pattern from: frappe/router.js convert_to_standard_route() lines 171-207
 * 
 * URL Examples:
 * /app/stock      → Stock workspace
 * /app/item       → Item list view
 * /app/sales-order → Sales Order list view
 */
export default function DynamicRoutePage({ params }: DynamicRouteProps) {
  const { route: routeSlug } = use(params)
  const decodedRoute = decodeComponent(routeSlug)  // Decode URL (ERPNext pattern)
  const { data: boot } = useBoot()

  // Hooks must be called in the same order on every render.
  // Resolve Page with enabled=false until boot is available.
  const pageName = slugify(decodedRoute)
  const bootReady = !!boot

  // Step 1: Check if it's a workspace (ERPNext line 181)
  // Case-insensitive slug matching
  const workspace = bootReady
    ? boot!.allowed_workspaces?.find((ws: Workspace) => slugify(ws.name) === slugify(decodedRoute))
    : null
  
  // Step 2: Check if it's a DocType slug (ERPNext line 202)
  // Convert slug back to DocType name: "sales-order" → "Sales Order"
  const doctype = bootReady ? unslugify(decodedRoute, boot as any) : null
  
  // Step 3: Check if it's a Desk Page (e.g. permission-manager, user-profile)
  const shouldResolvePage = bootReady && !workspace && !doctype
  const { data: pageResult, isLoading: pageLoading } = useResolvedPage(pageName, shouldResolvePage)
  const Page = getRegisteredPage(pageName)

  if (!boot) {
    return <WorkspaceSkeleton />
  }

  if (workspace) {
    return <WorkspaceView workspace={workspace} />
  }

  if (doctype) {
    return <ListView doctype={doctype} />
  }

  if (pageLoading) {
    return <WorkspaceSkeleton />
  }

  if (pageResult?.ok && pageResult.page) {
    if (Page) {
      return <Page />
    }
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-4 text-yellow-600" />
        <h3 className="text-lg font-semibold mb-2">Page Not Supported Yet</h3>
        <p className="text-muted-foreground mb-4">
          "{routeSlug}" is a Desk Page, but it hasn’t been implemented in this frontend yet.
        </p>
        <Link href="/app/home" className="text-primary hover:underline">
          Go to Home
        </Link>
      </Card>
    )
  }

  if (pageResult && !pageResult.ok) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-semibold mb-2">{pageResult.error.title}</h3>
        <p className="text-muted-foreground mb-4">{pageResult.error.message}</p>
        <Link href="/app/home" className="text-primary hover:underline">
          Go to Home
        </Link>
      </Card>
    )
  }

  // Step 4: Not found
  return (
    <Card className="p-12 text-center">
      <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
      <h3 className="text-lg font-semibold mb-2">Page Not Found</h3>
      <p className="text-muted-foreground mb-4">
        "{routeSlug}" is not a valid workspace, DocType, or Page
      </p>
      <Link href="/app/home" className="text-primary hover:underline">
        Go to Home
      </Link>
    </Card>
  )
}

/**
 * Workspace View Component
 * Renders workspace content with shortcuts, cards, and number cards
 */
function WorkspaceView({ workspace }: { workspace: Workspace }) {
  const { data: details, isLoading, error } = useWorkspaceDetails(workspace)

  if (isLoading) {
    return (
      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar />
        <div className="flex-1"><WorkspaceSkeleton /></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSidebar />
        <div className="flex-1 p-8">
          <Card className="p-8">
            <div className="flex items-start gap-4 text-red-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Error Loading Workspace</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {error.message}
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
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Workspace Sidebar - Part of this page (ERPNext pattern) */}
      <WorkspaceSidebar />
      
      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{workspace.title}</h1>
            <p className="text-muted-foreground mt-1">{workspace.module} Module</p>
          </div>

          {details?.number_cards && details.number_cards.items.length > 0 && (
            <NumberCardGrid cards={details.number_cards.items} />
          )}

          {details?.shortcuts && details.shortcuts.items.length > 0 && (
            <ShortcutGrid 
              shortcuts={details.shortcuts.items}
              workspaceModule={workspace.module}
            />
          )}

          {details?.cards && details.cards.items.length > 0 && (
            <LinkCardGrid 
              cards={details.cards.items}
              workspaceModule={workspace.module}
            />
          )}

          {(!details?.cards?.items || details.cards.items.length === 0) && 
           (!details?.shortcuts?.items || details.shortcuts.items.length === 0) && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                This workspace is empty. Configure it in ERPNext backend.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

