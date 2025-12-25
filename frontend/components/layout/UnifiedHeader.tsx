'use client'

import Link from 'next/link'
import { Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchBar } from './SearchBar'
import { Breadcrumbs } from './Breadcrumbs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function UnifiedHeader() {
  return (
    <header className="h-14 border-b bg-white sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 h-full max-w-full">
        {/* LEFT: Logo + Breadcrumbs */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Company Logo */}
          <Link href="/dashboard" className="flex-shrink-0">
            <div className="h-8 w-8 bg-primary rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
          </Link>
          
          {/* Dynamic Breadcrumbs */}
          <Breadcrumbs />
        </div>
        
        {/* RIGHT: Search + Notifications + User */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <SearchBar />
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
              >
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-sm">
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

