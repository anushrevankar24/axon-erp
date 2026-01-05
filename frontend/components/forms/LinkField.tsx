"use client"

import * as React from "react"
import { Check, ChevronsUpDown, ExternalLink, Loader2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { slugify } from "@/lib/utils/workspace"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useQuery } from "@tanstack/react-query"
import { call } from "@/lib/api/client"
import { validateLink } from "@/lib/api/document"

interface LinkOption {
  value: string
  description?: string
}

interface LinkFieldProps {
  value?: any
  onChange: (value: string) => void
  doctype: string
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Search API function
async function searchLink(doctype: string, txt: string): Promise<LinkOption[]> {
  try {
    const response = await call('frappe.desk.search.search_link', {
      doctype,
      txt,
      page_length: 20
    })
    
    // ERPNext returns results in different formats, normalize it
    const results = response?.message || response || []
    
    // Handle different response formats
    if (Array.isArray(results)) {
      return results.map((item: any) => {
        if (typeof item === 'string') {
          return { value: item }
        }
        return {
          value: item.value || item.name || item,
          description: item.description || ''
        }
      })
    }
    
    return []
  } catch (error) {
    console.error('Error searching link:', error)
    return []
  }
}

// Check if doctype is small (for preloading)
async function getDocTypeSize(doctype: string): Promise<number> {
  try {
    const response = await call('frappe.client.get_count', {
      doctype
    })
    return response?.message || 0
  } catch (error) {
    console.error('Error getting doctype size:', error)
    return 999 // Assume large if error
  }
}

export function LinkField({
  value,
  onChange,
  doctype,
  placeholder,
  disabled = false,
  hasError = false
}: LinkFieldProps) {
  const router = useRouter()
  // Enforce Desk contract: Link fields store and render string names.
  // If callers accidentally pass objects (e.g., boot.user), render safely as empty.
  const stringValue = typeof value === "string" ? value : ""
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const debouncedSearch = useDebounce(searchTerm, 300)

  // Check if doctype is small on mount
  const { data: doctypeSize } = useQuery({
    queryKey: ['doctype-size', doctype],
    queryFn: () => getDocTypeSize(doctype),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  const isSmallDocType = (doctypeSize || 0) < 100

  // Search query
  const { data: options = [], isLoading } = useQuery({
    queryKey: ['link-search', doctype, debouncedSearch],
    queryFn: () => searchLink(doctype, debouncedSearch),
    enabled: open && (debouncedSearch.length > 0 || isSmallDocType),
    staleTime: 30 * 1000, // Cache for 30 seconds
  })

  // Preload all options for small doctypes
  const { data: allOptions } = useQuery({
    queryKey: ['link-all', doctype],
    queryFn: () => searchLink(doctype, ''),
    enabled: isSmallDocType && open,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Use preloaded options for small doctypes, otherwise use search results
  const displayOptions = isSmallDocType && allOptions ? allOptions : options

  // Filter client-side for small doctypes
  const filteredOptions = React.useMemo(() => {
    if (!isSmallDocType || !searchTerm) return displayOptions
    
    const lowerSearch = searchTerm.toLowerCase()
    return displayOptions.filter(opt => 
      opt.value.toLowerCase().includes(lowerSearch) ||
      opt.description?.toLowerCase().includes(lowerSearch)
    )
  }, [displayOptions, searchTerm, isSmallDocType])

  const handleSelect = async (selectedValue: string) => {
    if (selectedValue === stringValue) {
      onChange("")
      setOpen(false)
      setSearchTerm("")
      return
    }
    
    // Desk pattern: validate link on selection
    // Based on: frappe/public/js/frappe/form/controls/link.js::validate_link_and_fetch()
    try {
      const result = await validateLink(doctype, selectedValue)
      if (result.success && result.doc) {
        // Use the validated/canonical name from server
        onChange(result.doc.name || selectedValue)
      } else {
        // Validation failed, but still set the value (Desk allows invalid links temporarily)
        onChange(selectedValue)
      }
    } catch (error) {
      // Network error or validation failed, still set the value
      onChange(selectedValue)
    }
    
    setOpen(false)
    setSearchTerm("")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setSearchTerm("")
  }

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!stringValue) return
    router.push(`/app/${slugify(doctype)}/${encodeURIComponent(stringValue)}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-8 text-sm",
            !stringValue && "text-muted-foreground",
            hasError && "border-red-500 focus:ring-red-500"
          )}
        >
          <span className="truncate">
            {stringValue || placeholder || `Select ${doctype}`}
          </span>
          <div className="flex items-center gap-2">
            {stringValue && !disabled && (
              <span
                className="inline-flex items-center justify-center opacity-50 hover:opacity-100 cursor-pointer"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleOpenLink}
                aria-label="Open Link"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
              </span>
            )}
            {stringValue && !disabled && (
              <span
                className="inline-flex items-center justify-center opacity-50 hover:opacity-100 cursor-pointer"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleClear}
                aria-label="Clear"
              >
                <X className="h-4 w-4 shrink-0" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${doctype}...`}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            )}
            
            {!isLoading && filteredOptions.length === 0 && (
              <CommandEmpty>
                {searchTerm ? `No results found for "${searchTerm}"` : 'Start typing to search...'}
              </CommandEmpty>
            )}
            
            {!isLoading && filteredOptions.length > 0 && (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{option.value}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

