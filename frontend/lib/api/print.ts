/**
 * Print/PDF API - Official Frappe Print Methods
 * 
 * Provides wrappers around frappe.utils.print_format.* methods
 * for generating and downloading PDFs.
 * 
 * Based on: frappe/utils/print_format.py
 */

import { call } from './client'
import { parseFrappeError, type FrappeError } from '@/lib/utils/errors'

/**
 * Download PDF for a document
 * 
 * Calls frappe.utils.print_format.download_pdf
 * 
 * @param doctype - DocType name
 * @param name - Document name
 * @param format - Print format name (optional, uses default if not provided)
 * @param no_letterhead - Whether to exclude letterhead
 * @param language - Language code for translation
 * @param letterhead - Specific letterhead name
 */
export async function downloadPDF(params: {
  doctype: string
  name: string
  format?: string
  no_letterhead?: boolean
  language?: string
  letterhead?: string
}): Promise<{ success: boolean; error?: FrappeError }> {
  try {
    // This method typically returns a download or redirect
    // In a browser context, we'll construct the URL and trigger download
    const queryParams = new URLSearchParams({
      doctype: params.doctype,
      name: params.name,
      format: params.format || 'Standard',
      ...(params.no_letterhead && { no_letterhead: '1' }),
      ...(params.language && { _lang: params.language }),
      ...(params.letterhead && { letterhead: params.letterhead }),
    })
    
    // Use the printview URL which is the standard Frappe approach
    const url = `/api/method/frappe.utils.print_format.download_pdf?${queryParams.toString()}`
    
    // Trigger download in browser
    window.open(url, '_blank')
    
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Get print formats available for a doctype
 * 
 * This queries the DocType meta's __print_formats
 * which is loaded via getdoctype
 * 
 * @param meta - DocType metadata with __print_formats
 */
export function getPrintFormats(meta: any): Array<{ name: string; standard?: string }> {
  if (!meta?.__print_formats) {
    return []
  }
  
  return meta.__print_formats
}

/**
 * Get printview HTML (for preview)
 * 
 * Calls frappe.www.printview.get_html_and_style
 * 
 * @param doctype - DocType name
 * @param name - Document name
 * @param print_format - Print format name
 * @param no_letterhead - Exclude letterhead
 */
export async function getPrintHTML(params: {
  doctype: string
  name: string
  print_format?: string
  no_letterhead?: boolean
}): Promise<{ success: boolean; html?: string; error?: FrappeError }> {
  try {
    const result = await call('frappe.www.printview.get_html_and_style', {
      doctype: params.doctype,
      name: params.name,
      format: params.print_format || 'Standard',
      no_letterhead: params.no_letterhead ? 1 : 0,
    })
    
    return {
      success: true,
      html: result.message?.html || result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Open print preview in new window (Desk pattern)
 * 
 * @param doctype - DocType name
 * @param name - Document name
 * @param print_format - Print format name
 */
export function openPrintPreview(params: {
  doctype: string
  name: string
  print_format?: string
  language?: string
}): void {
  const queryParams = new URLSearchParams({
    doctype: params.doctype,
    name: params.name,
    ...(params.print_format && { format: params.print_format }),
    ...(params.language && { _lang: params.language }),
  })
  
  const url = `/printview?${queryParams.toString()}`
  window.open(url, '_blank')
}

