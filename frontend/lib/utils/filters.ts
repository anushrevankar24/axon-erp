/**
 * Filter utilities for Desk parity
 * 
 * Converts between dict-style filters (for UI convenience) and Desk-style filter tuples
 * Based on: frappe/public/js/frappe/list/list_filter.js and frappe/desk/reportview.py
 */

import type { FilterTuple } from '@/lib/api/list'

/**
 * Convert dict-style filters to Desk-style filter tuples
 * 
 * Dict format (UI convenience): { owner: 'admin', status: 'Open' }
 * Tuple format (Desk API): [['owner', '=', 'admin'], ['status', '=', 'Open']]
 * 
 * Special handling for Desk standard fields:
 * - _assign: uses 'like' operator with % wildcards
 * - _user_tags: uses 'like' operator with % wildcards
 * - _liked_by: uses 'like' operator with % wildcards
 * - _comments: uses 'like' operator with % wildcards
 * 
 * @param filters - Dict-style filters
 * @returns Array of filter tuples
 */
export function dictFiltersToTuples(filters: Record<string, any>): FilterTuple[] {
  if (!filters || Object.keys(filters).length === 0) return []
  
  return Object.entries(filters).map(([fieldname, value]) => {
    // Special fields that use 'like' operator in Desk
    const likeFields = ['_assign', '_user_tags', '_liked_by', '_comments']
    
    if (likeFields.includes(fieldname)) {
      // Desk wraps these in % wildcards for partial matching
      const likeValue = value.startsWith('%') ? value : `%${value}%`
      return [fieldname, 'like', likeValue] as FilterTuple
    }
    
    // Handle null/empty values
    if (value === null) {
      return [fieldname, 'is', 'not set'] as FilterTuple
    }
    
    // Handle array values (IN operator)
    if (Array.isArray(value)) {
      return [fieldname, 'in', value] as FilterTuple
    }
    
    // Default: equality operator
    return [fieldname, '=', value] as FilterTuple
  })
}

/**
 * Convert Desk-style filter tuples to dict-style filters
 * 
 * This is for UI convenience - allows components to work with simple objects
 * Note: This loses operator information, so it's mainly for display/editing
 * 
 * @param tuples - Array of filter tuples
 * @returns Dict-style filters
 */
export function tuplesToDictFilters(tuples: FilterTuple[]): Record<string, any> {
  if (!tuples || tuples.length === 0) return {}
  
  const dict: Record<string, any> = {}
  
  tuples.forEach(tuple => {
    // Handle both [fieldname, operator, value] and [doctype, fieldname, operator, value]
    const fieldname = tuple.length === 4 ? tuple[1] : tuple[0]
    const operator = tuple.length === 4 ? tuple[2] : tuple[1]
    const value = tuple.length === 4 ? tuple[3] : tuple[2]
    
    // Strip % wildcards from 'like' values for display
    if (operator === 'like' && typeof value === 'string') {
      dict[fieldname] = value.replace(/%/g, '')
    } else if (operator === 'is' && value === 'not set') {
      dict[fieldname] = null
    } else {
      dict[fieldname] = value
    }
  })
  
  return dict
}

/**
 * Add a filter tuple to an existing array (Desk pattern)
 * 
 * Replaces existing filter for the same field (Desk behavior)
 * 
 * @param existing - Existing filter tuples
 * @param newFilter - New filter tuple to add
 * @returns Updated filter tuples
 */
export function addFilterTuple(existing: FilterTuple[], newFilter: FilterTuple): FilterTuple[] {
  const fieldname = newFilter.length === 4 ? newFilter[1] : newFilter[0]
  
  // Remove existing filter for this field
  const filtered = existing.filter(f => {
    const fname = f.length === 4 ? f[1] : f[0]
    return fname !== fieldname
  })
  
  // Add new filter
  return [...filtered, newFilter]
}

/**
 * Remove a filter tuple by fieldname
 * 
 * @param existing - Existing filter tuples
 * @param fieldname - Field name to remove
 * @returns Updated filter tuples
 */
export function removeFilterTuple(existing: FilterTuple[], fieldname: string): FilterTuple[] {
  return existing.filter(f => {
    const fname = f.length === 4 ? f[1] : f[0]
    return fname !== fieldname
  })
}

/**
 * Get filter value by fieldname
 * 
 * @param tuples - Filter tuples
 * @param fieldname - Field name to find
 * @returns Filter value or undefined
 */
export function getFilterValue(tuples: FilterTuple[], fieldname: string): any {
  const filter = tuples.find(f => {
    const fname = f.length === 4 ? f[1] : f[0]
    return fname === fieldname
  })
  
  if (!filter) return undefined
  
  const value = filter.length === 4 ? filter[3] : filter[2]
  const operator = filter.length === 4 ? filter[2] : filter[1]
  
  // Strip % wildcards from 'like' values
  if (operator === 'like' && typeof value === 'string') {
    return value.replace(/%/g, '')
  }
  
  return value
}

