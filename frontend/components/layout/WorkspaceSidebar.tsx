'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Settings, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth/AuthContext'
import { useWorkspaces } from '@/lib/api/workspace'
import { getWorkspaceIcon } from '@/lib/utils/icons'
import { slugify } from '@/lib/utils/workspace'

/**
 * Sidebar Content Component
 * Pattern from: frappe/views/workspace/workspace.js make_sidebar()
 */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data: workspaceData, isLoading, error } = useWorkspaces()
  const { logout } = useAuth()
  const pathname = usePathname()
  
  const handleLogout = async () => {
    await logout()
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  // Separate public and private workspaces (ERPNext pattern)
  const pages = workspaceData.pages || []
  const homeWorkspace = pages.find((ws: any) => slugify(ws?.name || ws?.title || '') === 'home')
  const publicWorkspaces = pages.filter((ws: any) => ws.public && ws !== homeWorkspace)
  const privateWorkspaces = pages.filter((ws: any) => !ws.public && ws !== homeWorkspace)

  const renderWorkspaceButton = (workspace: any) => {
    const Icon = getWorkspaceIcon(workspace.icon)
    const href = workspace.public 
      ? `/app/${workspace.name}`
      : `/app/private/${workspace.name}`
    const isActive = pathname?.startsWith(href)
    
    return (
      <Link key={workspace.name} href={href} onClick={onNavigate}>
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          className="w-full justify-start"
        >
          {workspace.public ? (
            <Icon className="w-4 h-4 mr-2" />
          ) : (
            <span className={`w-2 h-2 rounded-full mr-3 bg-${workspace.indicator_color || 'gray'}-500`} />
          )}
          {workspace.title}
        </Button>
      </Link>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <h2 className="font-bold text-xl text-primary">Axon ERP</h2>
        <p className="text-xs text-muted-foreground">Enterprise Resource Planning</p>
      </div>
      
      {/* Workspace Navigation - ERPNext style: native scroll with transparent track */}
      <div className="flex-1 overflow-y-auto scrollbar-sidebar">
        <div className="p-2">
          {error && (
            <div className="p-4 text-red-500 text-sm rounded bg-red-50">
              Error loading workspaces: {error.message}
            </div>
          )}
          
          {pages.length === 0 ? (
            <div className="p-4 text-muted-foreground text-sm text-center">
              No workspaces available
            </div>
          ) : (
            <>
              {/* Home (special-cased like ERPNext) */}
              {homeWorkspace && (
                <div className="mb-3">
                  <Link
                    href={homeWorkspace.public ? `/app/${homeWorkspace.name}` : `/app/private/${homeWorkspace.name}`}
                    onClick={onNavigate}
                  >
                    <Button
                      variant={pathname?.startsWith(homeWorkspace.public ? `/app/${homeWorkspace.name}` : `/app/private/${homeWorkspace.name}`) ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Home
                    </Button>
                  </Link>
                </div>
              )}

              {/* Public Workspaces */}
              {publicWorkspaces.length > 0 && (
                <div className="mb-4">
                  <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Public
                  </h3>
                  <div className="space-y-1">
                    {publicWorkspaces.map(renderWorkspaceButton)}
                  </div>
                </div>
              )}
              
              {/* Private Workspaces */}
              {privateWorkspaces.length > 0 && (
                <div>
                  <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Personal
                  </h3>
                  <div className="space-y-1">
                    {privateWorkspaces.map(renderWorkspaceButton)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <Separator />
      <div className="p-2 space-y-1">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground"
          onClick={() => window.location.href = '/app/workspace-settings'}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}

/**
 * Workspace Sidebar Component (Page-Specific)
 * Pattern from: frappe/views/workspace/workspace.js prepare_container()
 * Sidebar is part of the workspace page, not global!
 */
export function WorkspaceSidebar() {
  return (
    <aside className="w-64 border-r border-gray-200 h-full flex-col bg-background flex">
      <SidebarContent />
    </aside>
  )
}

/**
 * Mobile Sidebar Component (Drawer)
 */
export function MobileSidebar() {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

