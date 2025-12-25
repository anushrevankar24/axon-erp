'use client'

import * as React from 'react'
import { useDocTypesByModule } from '@/lib/api/hooks'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Home, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/api/client'
import { toast } from 'sonner'

export const Sidebar = React.memo(function Sidebar() {
  const { data: doctypesByModule, isLoading, error } = useDocTypesByModule()
  const pathname = usePathname()
  const router = useRouter()
  
  // Only log errors
  React.useEffect(() => {
    if (error) {
      console.error('[Sidebar] Error loading DocTypes:', error)
    }
  }, [error])
  
  const handleLogout = async () => {
    try {
      // Frappe logout endpoint
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/method/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      if (response.ok || response.status === 403) {
        // 403 is also OK - means already logged out
        toast.success('Logged out successfully')
        router.push('/login')
        // Reload to clear any cached data
        window.location.href = '/login'
      } else {
        throw new Error(`Logout failed: ${response.status}`)
      }
    } catch (error: any) {
      console.error('[Sidebar] Logout error:', error.message)
      // Even if logout fails, redirect to login
      toast.info('Session cleared')
      window.location.href = '/login'
    }
  }
  
  if (isLoading) {
    return (
      <aside className="w-64 border-r h-full bg-white">
        <div className="p-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </aside>
    )
  }
  
  return (
    <aside className="w-64 border-r h-full flex flex-col bg-white">
      <div className="p-4 border-b">
        <h2 className="font-bold text-xl text-primary">Axon ERP</h2>
        <p className="text-xs text-muted-foreground">Enterprise Resource Planning</p>
      </div>
      
      <div className="p-2 border-b">
        <Link href="/dashboard">
          <Button variant={pathname === '/dashboard' ? 'secondary' : 'ghost'} className="w-full justify-start">
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 text-red-500 text-sm">
            Error loading DocTypes: {error.message}
          </div>
        )}
        {!doctypesByModule || Object.keys(doctypesByModule).length === 0 ? (
          <div className="p-4 text-muted-foreground text-sm">
            No DocTypes found. Make sure you're logged in.
          </div>
        ) : null}
        <Accordion type="multiple" className="p-2" defaultValue={['Selling', 'Buying', 'Stock', 'Accounts']}>
          {Object.entries(doctypesByModule || {}).map(([module, doctypes]) => (
            <AccordionItem key={module} value={module}>
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                {module}
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-0.5 pl-2">
                  {doctypes.map((dt: any) => {
                    const href = `/app/${encodeURIComponent(dt.module)}/${encodeURIComponent(dt.name)}`
                    const isActive = pathname === href
                    
                    return (
                      <li key={dt.name}>
                        <Link 
                          href={href}
                          className={`block px-3 py-1.5 text-sm rounded transition-colors ${
                            isActive 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-accent'
                          }`}
                        >
                          {dt.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      
      <div className="p-2 border-t">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground">
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
    </aside>
  )
})

