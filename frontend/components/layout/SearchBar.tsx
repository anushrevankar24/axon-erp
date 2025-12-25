'use client'

import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function SearchBar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Handle keyboard shortcut (Ctrl+G or Cmd+G)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault()
        setIsExpanded(true)
      }
      
      // Close on Escape
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
        setSearchQuery('')
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded])
  
  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])
  
  const handleBlur = () => {
    // Delay to allow click events to register
    setTimeout(() => {
      if (!searchQuery) {
        setIsExpanded(false)
      }
    }, 200)
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log('Searching for:', searchQuery)
    }
  }
  
  return (
    <div className="relative">
      {isExpanded ? (
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onBlur={handleBlur}
            placeholder="Search or type command (Ctrl+G)"
            className="h-9 text-sm pl-9 pr-3 w-80 transition-all"
          />
        </form>
      ) : (
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsExpanded(true)}
          title="Search (Ctrl+G)"
        >
          <Search className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

