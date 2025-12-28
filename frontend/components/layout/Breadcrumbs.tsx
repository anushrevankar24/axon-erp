'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useBoot } from '@/lib/api/hooks'
import { getWorkspaceForDocType, findWorkspace, slugify, unslugify } from '@/lib/utils/workspace'

/**
 * Breadcrumb Component
 * Pattern from: frappe/views/breadcrumbs.js
 * 
 * Generates breadcrumbs based on route:
 * - Home (always first)
 * - Workspace (resolved from DocType's module)
 * - DocType List
 * - Document Name
 */
export function Breadcrumbs() {
  const pathname = usePathname()
  const { data: boot } = useBoot()
  
  const getBreadcrumbs = () => {
    const items: Array<{ label: string; href: string; isLast?: boolean }> = [
      { label: 'Home', href: '/app/home' }
    ]
    
    if (!pathname || !boot) return items
    
    const segments = pathname.split('/').filter(Boolean)
    
    // Skip if not /app route
    if (segments[0] !== 'app') return items
    
    const [, segment1, segment2, segment3] = segments
    
    // Pattern 1: /app/home
    if (segment1 === 'home') {
      items[0].isLast = true
      return items
    }
    
    // Pattern 2: /app/{workspace-slug} or /app/{doctype-slug}
    if (segment1 && !segment2) {
      // Check if it's a workspace (using slug)
      const workspace = boot.allowed_workspaces?.find(
        (ws: any) => slugify(ws.name) === segment1
      )
      
      if (workspace) {
        items.push({
          label: workspace.title,
          href: `/app/${segment1}`,
          isLast: true
        })
        return items
      }
      
      // Otherwise it's a DocType list
      const doctype = unslugify(segment1, boot)
      if (doctype) {
        // Resolve workspace from DocType's module
        const workspaceName = getWorkspaceForDocType(doctype, boot)
        if (workspaceName) {
          const ws = findWorkspace(boot.allowed_workspaces || [], workspaceName)
          if (ws) {
            items.push({
              label: ws.title,
              href: `/app/${slugify(ws.name)}`,
              isLast: false
            })
          }
        }
        
        items.push({
          label: doctype,
          href: `/app/${segment1}`,
          isLast: true
        })
      }
      return items
    }
    
    // Pattern 3: /app/{doctype-slug}/{id}
    if (segment2) {
      // Convert slug to DocType
      const doctype = unslugify(segment1, boot)
      
      if (doctype) {
        // Resolve workspace from DocType's module
        const workspaceName = getWorkspaceForDocType(doctype, boot)
        if (workspaceName) {
          const workspace = findWorkspace(boot.allowed_workspaces || [], workspaceName)
          if (workspace) {
            items.push({
              label: workspace.title,
              href: `/app/${slugify(workspace.name)}`,
              isLast: false
            })
          }
        }
        
        items.push({
          label: doctype,
          href: `/app/${segment1}`,
          isLast: false
        })
        
        items.push({
          label: decodeURIComponent(segment2),
          href: `/app/${segment1}/${segment2}`,
          isLast: true
        })
      }
    }
    
    return items
  }
  
  const breadcrumbs = getBreadcrumbs()
  
  // Don't show breadcrumbs if only Home
  if (breadcrumbs.length === 1) return null
  
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground overflow-hidden">
      {breadcrumbs.map((item, index) => (
        <div key={`${item.href}-${index}`} className="flex items-center gap-1.5 shrink-0">
          {index > 0 && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
          {item.isLast ? (
            <span className="text-foreground font-medium truncate max-w-[250px]">
              {item.label}
            </span>
          ) : (
            <Link 
              href={item.href} 
              className="hover:text-foreground transition-colors truncate"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
