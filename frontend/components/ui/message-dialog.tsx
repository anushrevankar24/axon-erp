'use client'

/**
 * Message Dialog - ERPNext Style
 * 
 * Replicates Frappe's msgprint() functionality for React.
 * Based on: frappe/public/js/frappe/ui/messages.js
 * 
 * Features:
 * - Indicator colors (red, orange, yellow, green, blue)
 * - HTML content support
 * - Primary/secondary actions
 * - Multiple messages stacked with separator
 * - Global singleton pattern (like frappe.msg_dialog)
 */

import * as React from 'react'
import { createContext, useContext, useState, useCallback, createRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FrappeError } from '@/lib/utils/errors'

// ============================================================================
// Types
// ============================================================================

export type IndicatorColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue'

export interface MessageDialogOptions {
  message: string
  title?: string
  indicator?: IndicatorColor
  primaryAction?: {
    label: string
    action: () => void
  }
  secondaryAction?: {
    label: string
    action: () => void
  }
  wide?: boolean
  isMinimizable?: boolean
}

interface MessageDialogContextType {
  showMessage: (options: MessageDialogOptions | string) => void
  showError: (error: FrappeError | string) => void
  showValidationError: (title: string, fields: string[]) => void
  hideMessage: () => void
}

// ============================================================================
// Indicator Styles
// ============================================================================

const indicatorStyles: Record<IndicatorColor, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
}

const indicatorTextStyles: Record<IndicatorColor, string> = {
  red: 'text-red-600',
  orange: 'text-orange-600',
  yellow: 'text-yellow-600',
  green: 'text-green-600',
  blue: 'text-blue-600',
}

// ============================================================================
// Context
// ============================================================================

const MessageDialogContext = createContext<MessageDialogContextType | undefined>(undefined)

export function useMessageDialog() {
  const context = useContext(MessageDialogContext)
  if (!context) {
    throw new Error('useMessageDialog must be used within MessageDialogProvider')
  }
  return context
}

// ============================================================================
// Provider Component
// ============================================================================

export function MessageDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<MessageDialogOptions>({
    message: '',
    title: 'Message',
    indicator: 'blue',
  })

  const showMessage = useCallback((opts: MessageDialogOptions | string) => {
    if (typeof opts === 'string') {
      setOptions({
        message: opts,
        title: 'Message',
        indicator: 'blue',
      })
    } else {
      setOptions({
        title: 'Message',
        indicator: 'blue',
        ...opts,
      })
    }
    setIsOpen(true)
  }, [])

  const showError = useCallback((error: FrappeError | string) => {
    if (typeof error === 'string') {
      setOptions({
        message: error,
        title: 'Error',
        indicator: 'red',
      })
    } else {
      setOptions({
        message: error.message,
        title: error.title || 'Error',
        indicator: error.indicator || 'red',
      })
    }
    setIsOpen(true)
  }, [])

  const showValidationError = useCallback((title: string, fields: string[]) => {
    const message = fields.length > 0
      ? `<ul class="list-disc pl-4 mt-2">${fields.map(f => `<li>${f}</li>`).join('')}</ul>`
      : 'Please check your input.'

    setOptions({
      message,
      title,
      indicator: 'red',
    })
    setIsOpen(true)
  }, [])

  const hideMessage = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handlePrimaryAction = useCallback(() => {
    options.primaryAction?.action()
    setIsOpen(false)
  }, [options.primaryAction])

  const handleSecondaryAction = useCallback(() => {
    options.secondaryAction?.action()
    setIsOpen(false)
  }, [options.secondaryAction])

  return (
    <MessageDialogContext.Provider value={{ showMessage, showError, showValidationError, hideMessage }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className={cn(
            'max-w-md',
            options.wide && 'max-w-2xl'
          )}
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              {options.indicator && (
                <div 
                  className={cn(
                    'w-2 h-2 rounded-full',
                    indicatorStyles[options.indicator]
                  )}
                />
              )}
              <DialogTitle className={cn(
                options.indicator && indicatorTextStyles[options.indicator]
              )}>
                {options.title}
              </DialogTitle>
            </div>
          </DialogHeader>
          
          <DialogDescription asChild>
            <div 
              className="text-sm text-foreground msgprint-content"
              dangerouslySetInnerHTML={{ __html: options.message }}
            />
          </DialogDescription>

          {(options.primaryAction || options.secondaryAction) && (
            <DialogFooter>
              {options.secondaryAction && (
                <Button variant="outline" onClick={handleSecondaryAction}>
                  {options.secondaryAction.label}
                </Button>
              )}
              {options.primaryAction && (
                <Button onClick={handlePrimaryAction}>
                  {options.primaryAction.label}
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </MessageDialogContext.Provider>
  )
}

// ============================================================================
// Standalone Component (for non-context usage)
// ============================================================================

interface MessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
  title?: string
  indicator?: IndicatorColor
  primaryAction?: {
    label: string
    action: () => void
  }
  secondaryAction?: {
    label: string
    action: () => void
  }
  wide?: boolean
}

export function MessageDialog({
  open,
  onOpenChange,
  message,
  title = 'Message',
  indicator = 'blue',
  primaryAction,
  secondaryAction,
  wide,
}: MessageDialogProps) {
  const handlePrimaryAction = () => {
    primaryAction?.action()
    onOpenChange(false)
  }

  const handleSecondaryAction = () => {
    secondaryAction?.action()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          'max-w-md',
          wide && 'max-w-2xl'
        )}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            {indicator && (
              <div 
                className={cn(
                  'w-2 h-2 rounded-full',
                  indicatorStyles[indicator]
                )}
              />
            )}
            <DialogTitle className={cn(
              indicator && indicatorTextStyles[indicator]
            )}>
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <DialogDescription asChild>
          <div 
            className="text-sm text-foreground msgprint-content"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        </DialogDescription>

        {(primaryAction || secondaryAction) && (
          <DialogFooter>
            {secondaryAction && (
              <Button variant="outline" onClick={handleSecondaryAction}>
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button onClick={handlePrimaryAction}>
                {primaryAction.label}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Helper Functions (for use outside of React components)
// ============================================================================

// Singleton reference for imperative API
let messageDialogRef: {
  showMessage: (options: MessageDialogOptions | string) => void
  showError: (error: FrappeError | string) => void
  showValidationError: (title: string, fields: string[]) => void
  hideMessage: () => void
} | null = null

export function setMessageDialogRef(ref: typeof messageDialogRef) {
  messageDialogRef = ref
}

/**
 * Show a message dialog (imperative API)
 * Must be used after MessageDialogProvider is mounted
 */
export function msgprint(options: MessageDialogOptions | string) {
  if (messageDialogRef) {
    messageDialogRef.showMessage(options)
  } else {
    console.warn('MessageDialogProvider not mounted. Using console.log instead.')
    console.log('Message:', typeof options === 'string' ? options : options.message)
  }
}

/**
 * Show an error dialog (imperative API)
 */
export function showError(error: FrappeError | string) {
  if (messageDialogRef) {
    messageDialogRef.showError(error)
  } else {
    console.error('Error:', typeof error === 'string' ? error : error.message)
  }
}

/**
 * Hide the message dialog (imperative API)
 */
export function hideMessage() {
  if (messageDialogRef) {
    messageDialogRef.hideMessage()
  }
}

// ============================================================================
// Styles for HTML content
// ============================================================================

// Add these styles to your globals.css:
/*
.msgprint-content ul {
  @apply list-disc pl-4 mt-2;
}

.msgprint-content ol {
  @apply list-decimal pl-4 mt-2;
}

.msgprint-content li {
  @apply mb-1;
}

.msgprint-content a {
  @apply text-blue-600 hover:underline;
}

.msgprint-content strong, .msgprint-content b {
  @apply font-semibold;
}

.msgprint-content hr {
  @apply my-3 border-gray-200;
}

.msgprint-content table {
  @apply w-full border-collapse mt-2;
}

.msgprint-content th, .msgprint-content td {
  @apply border border-gray-200 px-2 py-1 text-left;
}
*/

