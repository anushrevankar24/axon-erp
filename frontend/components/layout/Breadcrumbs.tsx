'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function Breadcrumbs() {
  const pathname = usePathname()
  
  // Parse pathname to create breadcrumb items
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const items = [{ label: 'Home', href: '/dashboard' }]
    
    // Skip 'app' segment if present
    const relevantSegments = segments[0] === 'app' ? segments.slice(1) : segments
    
    let currentPath = '/app'
    
    relevantSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Decode URL-encoded segments
      const decodedSegment = decodeURIComponent(segment)
      
      // Format segment (capitalize, replace hyphens/underscores)
      const label = decodedSegment
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      items.push({
        label,
        href: currentPath,
        isLast: index === relevantSegments.length - 1
      })
    })
    
    return items
  }
  
  const breadcrumbs = getBreadcrumbs()
  
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground overflow-hidden">
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center gap-1.5 shrink-0">
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

