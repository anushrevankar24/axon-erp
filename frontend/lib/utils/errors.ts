/**
 * Frappe Error Parser - ERPNext Production Pattern
 * 
 * Parses error responses from Frappe/ERPNext APIs into user-friendly messages.
 * Handles both REST API and Desk API response formats.
 * 
 * Based on:
 * - frappe/public/js/frappe/request.js (error handling, cleanup)
 * - frappe/utils/response.py (_server_messages format)
 * - frappe/exceptions.py (error types and HTTP codes)
 */

// ============================================================================
// Types
// ============================================================================

export interface FrappeError {
  message: string
  title: string
  type: 'validation' | 'permission' | 'duplicate' | 'not_found' | 'system'
  indicator: 'red' | 'orange' | 'yellow' | 'blue'
  fields?: string[]  // Fields with errors (for highlighting)
  exc_type?: string  // Exception type from backend
  httpStatus?: number
}

export interface ServerMessage {
  message: string
  title?: string
  indicator?: string
  raise_exception?: boolean
}

// ============================================================================
// Main Error Parser
// ============================================================================

/**
 * Parse Frappe error response into structured error object
 * 
 * @param error - Error object from API call (axios error or parsed response)
 * @returns Structured FrappeError object
 */
export function parseFrappeError(error: any): FrappeError {
  const responseData = error.response?.data || error
  const httpStatus = error.response?.status || error.httpStatus

  // 1. Try _server_messages (highest priority - user-friendly messages from Frappe)
  if (responseData._server_messages) {
    const parsed = parseServerMessages(responseData._server_messages)
    if (parsed) {
      return {
        ...parsed,
        httpStatus,
        exc_type: responseData.exc_type
      }
    }
  }

  // 2. Handle specific exception types
  const excType = responseData.exc_type || extractExcType(responseData.exception)
  if (excType) {
    const parsed = parseExceptionType(excType, responseData)
    if (parsed) {
      return { ...parsed, httpStatus }
    }
  }

  // 3. Try exception field (traceback)
  if (responseData.exception) {
    return {
      ...parseException(responseData.exception),
      httpStatus
    }
  }

  // 4. Try _error_message (Frappe's flags.error_message)
  if (responseData._error_message) {
    return {
      message: responseData._error_message,
      title: 'Error',
      type: 'validation',
      indicator: 'red',
      httpStatus
    }
  }

  // 5. Try direct message field
  if (responseData.message && typeof responseData.message === 'string') {
    return {
      message: responseData.message,
      title: 'Error',
      type: 'system',
      indicator: 'red',
      httpStatus
    }
  }

  // 6. Handle HTTP status codes
  if (httpStatus) {
    return parseHttpStatus(httpStatus)
  }

  // 7. Fallback
  if (error.message && typeof error.message === 'string') {
    return {
      message: error.message,
      title: 'Error',
      type: 'system',
      indicator: 'red'
    }
  }

  return {
    message: 'An unexpected error occurred',
    title: 'Error',
    type: 'system',
    indicator: 'red'
  }
}

// ============================================================================
// Server Messages Parser
// ============================================================================

/**
 * Parse _server_messages field (JSON array of messages)
 * 
 * Format from Frappe:
 * response["_server_messages"] = json.dumps([json.dumps(d) for d in frappe.local.message_log])
 * 
 * Each message is: { message, title, indicator, raise_exception, ... }
 */
function parseServerMessages(serverMessages: string): FrappeError | null {
  try {
    const messages: string[] = JSON.parse(serverMessages)
    const parsedMessages: ServerMessage[] = []
    const fields: string[] = []

    for (const msg of messages) {
      try {
        const parsed: ServerMessage = JSON.parse(msg)
        parsedMessages.push(parsed)

        // Extract field names from error messages
        const extractedFields = extractFieldNames(parsed.message)
        fields.push(...extractedFields)
      } catch {
        // If not JSON, use as plain string
        parsedMessages.push({ message: msg })
      }
    }

    if (parsedMessages.length === 0) return null

    // Filter to only show messages that raise exceptions if any exist
    const exceptionalMessages = parsedMessages.filter(m => m.raise_exception)
    const messagesToShow = exceptionalMessages.length > 0 ? exceptionalMessages : parsedMessages

    // Combine messages
    const combinedMessage = messagesToShow
      .map(m => m.message)
      .filter(Boolean)
      .join('\n')

    const firstMessage = messagesToShow[0]

    return {
      message: combinedMessage || 'An error occurred',
      title: firstMessage.title || 'Error',
      type: determineErrorType(parsedMessages),
      indicator: (firstMessage.indicator as FrappeError['indicator']) || 'red',
      fields: fields.length > 0 ? Array.from(new Set(fields)) : undefined
    }
  } catch (e) {
    console.error('Failed to parse _server_messages:', e)
    return null
  }
}

/**
 * Extract field names from error messages
 * Handles patterns like: "Value missing for: Field Name", "Row #1: Field is required"
 */
function extractFieldNames(message: string): string[] {
  const fields: string[] = []

  // Pattern: "Value missing for: Field Name"
  const missingMatch = message.match(/Value missing for[:\s]+([^,<]+)/gi)
  if (missingMatch) {
    for (const match of missingMatch) {
      const field = match.replace(/Value missing for[:\s]+/i, '').trim()
      if (field) fields.push(field)
    }
  }

  // Pattern: field names in <li> tags
  const liMatches = message.match(/<li>([^<]+)<\/li>/gi)
  if (liMatches) {
    for (const match of liMatches) {
      const field = match.replace(/<\/?li>/gi, '').trim()
      if (field) fields.push(field)
    }
  }

  return fields
}

/**
 * Determine error type from messages
 */
function determineErrorType(messages: ServerMessage[]): FrappeError['type'] {
  const allMessages = messages.map(m => m.message).join(' ').toLowerCase()

  if (allMessages.includes('permission') || allMessages.includes('not permitted')) {
    return 'permission'
  }
  if (allMessages.includes('duplicate') || allMessages.includes('already exists')) {
    return 'duplicate'
  }
  if (allMessages.includes('not found') || allMessages.includes('does not exist')) {
    return 'not_found'
  }

  return 'validation'
}

// ============================================================================
// Exception Type Parsers
// ============================================================================

/**
 * Extract exception type from exception string
 * e.g., "frappe.exceptions.MandatoryError: ..." -> "MandatoryError"
 */
function extractExcType(exception?: string): string | undefined {
  if (!exception) return undefined

  const lines = exception.split('\n')
  const lastLine = lines[lines.length - 1]

  const match = lastLine.match(/^([\w.]+Error|[\w.]+Exception)/)
  if (match) {
    return match[1].split('.').pop()
  }

  return undefined
}

/**
 * Parse specific exception types into user-friendly errors
 */
function parseExceptionType(excType: string, responseData: any): FrappeError | null {
  switch (excType) {
    case 'MandatoryError':
      return parseMandatoryError(responseData)

    case 'UniqueValidationError':
    case 'DuplicateEntryError':
      return parseDuplicateError(responseData)

    case 'LinkValidationError':
      return {
        message: 'One or more linked values are invalid',
        title: 'Invalid Link',
        type: 'validation',
        indicator: 'red',
        exc_type: excType
      }

    case 'ValidationError':
      return parseValidationError(responseData)

    case 'PermissionError':
      return {
        message: 'You do not have permission to perform this action',
        title: 'Permission Denied',
        type: 'permission',
        indicator: 'red',
        exc_type: excType
      }

    case 'DoesNotExistError':
      return {
        message: extractDoesNotExistMessage(responseData) || 'Record does not exist',
        title: 'Not Found',
        type: 'not_found',
        indicator: 'red',
        exc_type: excType
      }

    case 'TimestampMismatchError':
      return {
        message: 'This document has been modified by another user. Please refresh and try again.',
        title: 'Document Changed',
        type: 'validation',
        indicator: 'orange',
        exc_type: excType
      }

    case 'CSRFTokenError':
      return {
        message: 'Your session may have expired. Please refresh the page.',
        title: 'Session Error',
        type: 'system',
        indicator: 'orange',
        exc_type: excType
      }

    case 'QueryTimeoutError':
      return {
        message: 'Server was too busy to process this request. Please try again.',
        title: 'Request Timeout',
        type: 'system',
        indicator: 'red',
        exc_type: excType
      }

    case 'QueryDeadlockError':
      return {
        message: 'Server failed to process this request because of a concurrent conflicting request. Please try again.',
        title: 'Deadlock Occurred',
        type: 'system',
        indicator: 'red',
        exc_type: excType
      }

    default:
      return null
  }
}

/**
 * Parse MandatoryError to extract missing field names
 */
function parseMandatoryError(responseData: any): FrappeError {
  const fields: string[] = []

  // Try to extract field names from exception
  const exception = responseData.exception || ''
  const fieldMatch = exception.match(/\[[\w\s,]+\]:\s*(.+)$/)
  if (fieldMatch) {
    fields.push(...fieldMatch[1].split(',').map((f: string) => f.trim()))
  }

  return {
    message: fields.length > 0
      ? `Please fill mandatory fields: ${fields.join(', ')}`
      : 'Please fill all mandatory fields',
    title: 'Missing Fields',
    type: 'validation',
    indicator: 'red',
    fields,
    exc_type: 'MandatoryError'
  }
}

/**
 * Parse DuplicateEntryError/UniqueValidationError
 */
function parseDuplicateError(responseData: any): FrappeError {
  const exception = responseData.exception || ''
  let fieldName = ''
  let duplicateValue = ''

  // Try to extract from "Duplicate entry 'value' for key 'field'"
  const duplicateMatch = exception.match(/Duplicate entry '([^']+)' for key '([^']+)'/)
  if (duplicateMatch) {
    duplicateValue = duplicateMatch[1]
    fieldName = duplicateMatch[2]
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase())
  }

  const message = fieldName
    ? `Duplicate value "${duplicateValue}" for ${fieldName}`
    : 'This value already exists. Please use a unique value.'

  return {
    message,
    title: 'Duplicate Value',
    type: 'duplicate',
    indicator: 'red',
    fields: fieldName ? [fieldName] : undefined,
    exc_type: 'DuplicateEntryError'
  }
}

/**
 * Parse generic ValidationError
 */
function parseValidationError(responseData: any): FrappeError {
  // Try to extract meaningful message from exception
  const exception = responseData.exception || ''
  const lines = exception.split('\n')
  const lastLine = lines[lines.length - 1]

  // Extract message after ValidationError:
  const msgMatch = lastLine.match(/ValidationError:\s*(.+)/)
  const message = msgMatch ? msgMatch[1].replace(/[()'"]/g, '').trim() : 'Validation failed'

  return {
    message,
    title: 'Validation Error',
    type: 'validation',
    indicator: 'red',
    exc_type: 'ValidationError'
  }
}

/**
 * Extract DoesNotExistError message
 */
function extractDoesNotExistMessage(responseData: any): string | null {
  const exception = responseData.exception || ''
  const match = exception.match(/DoesNotExistError:\s*\(?([^)]+)\)?/)
  if (match) {
    return match[1].replace(/['"]/g, '').trim()
  }
  return null
}

// ============================================================================
// Exception String Parser
// ============================================================================

/**
 * Parse exception string (traceback) to extract readable error message
 */
function parseException(exceptionStr: string): FrappeError {
  const parts = exceptionStr.split('\n')
  const lastLine = parts[parts.length - 1].trim()

  // Try to extract the error type and message
  if (lastLine.includes(':')) {
    const colonIndex = lastLine.indexOf(':')
    const errorTypeFull = lastLine.substring(0, colonIndex)
    const errorDetails = lastLine.substring(colonIndex + 1).trim()

    // Extract just the error class name
    const errorType = errorTypeFull.split('.').pop() || ''

    // Format based on error type
    const formatted = formatErrorTypeMessage(errorType, errorDetails)

    return {
      message: formatted.message,
      title: formatted.title,
      type: formatted.type,
      indicator: 'red',
      exc_type: errorType
    }
  }

  return {
    message: lastLine || 'An error occurred',
    title: 'Error',
    type: 'system',
    indicator: 'red'
  }
}

/**
 * Format specific error types into user-friendly messages
 */
function formatErrorTypeMessage(errorType: string, errorDetails: string): {
  message: string
  title: string
  type: FrappeError['type']
} {
  const cleanDetails = errorDetails.replace(/[()'"]/g, '').trim()

  switch (errorType) {
    case 'UniqueValidationError':
    case 'DuplicateEntryError':
      return {
        message: formatDuplicateMessage(errorDetails),
        title: 'Duplicate Value',
        type: 'duplicate'
      }

    case 'MandatoryError':
      return {
        message: cleanDetails ? `${cleanDetails} is mandatory` : 'Please fill all mandatory fields',
        title: 'Missing Fields',
        type: 'validation'
      }

    case 'LinkValidationError':
      return {
        message: cleanDetails || 'Invalid link value',
        title: 'Invalid Link',
        type: 'validation'
      }

    case 'PermissionError':
      return {
        message: 'You do not have permission to perform this action',
        title: 'Permission Denied',
        type: 'permission'
      }

    case 'DoesNotExistError':
      return {
        message: cleanDetails || 'Record does not exist',
        title: 'Not Found',
        type: 'not_found'
      }

    case 'ValidationError':
      return {
        message: cleanDetails || 'Validation failed',
        title: 'Validation Error',
        type: 'validation'
      }

    default:
      // Make error type readable
      const readableType = errorType.replace(/([A-Z])/g, ' $1').trim()
      return {
        message: cleanDetails || readableType,
        title: readableType || 'Error',
        type: 'system'
      }
  }
}

/**
 * Format duplicate entry error message
 */
function formatDuplicateMessage(errorDetails: string): string {
  if (errorDetails.includes('Duplicate entry')) {
    const fieldMatch = errorDetails.match(/for key '([^']+)'/)
    if (fieldMatch) {
      const fieldName = fieldMatch[1]
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
      return `Duplicate value for ${fieldName}`
    }
    return 'This value already exists'
  }

  return errorDetails.replace(/[()'"]/g, '').trim() || 'Duplicate entry detected'
}

// ============================================================================
// HTTP Status Handler
// ============================================================================

/**
 * Parse HTTP status code into error message
 */
function parseHttpStatus(status: number): FrappeError {
  switch (status) {
    case 401:
      return {
        message: 'You are not logged in. Please log in and try again.',
        title: 'Authentication Required',
        type: 'permission',
        indicator: 'orange',
        httpStatus: status
      }

    case 403:
      return {
        message: 'You do not have permission to perform this action.',
        title: 'Permission Denied',
        type: 'permission',
        indicator: 'red',
        httpStatus: status
      }

    case 404:
      return {
        message: 'The requested resource was not found.',
        title: 'Not Found',
        type: 'not_found',
        indicator: 'red',
        httpStatus: status
      }

    case 409:
      return {
        message: 'This value already exists. Please use a unique value.',
        title: 'Duplicate Entry',
        type: 'duplicate',
        indicator: 'red',
        httpStatus: status
      }

    case 417:
      return {
        message: 'Validation failed. Please check your input.',
        title: 'Validation Error',
        type: 'validation',
        indicator: 'red',
        httpStatus: status
      }

    case 500:
      return {
        message: 'An internal server error occurred. Please try again later.',
        title: 'Server Error',
        type: 'system',
        indicator: 'red',
        httpStatus: status
      }

    case 502:
    case 503:
    case 504:
      return {
        message: 'The server is temporarily unavailable. Please try again later.',
        title: 'Server Unavailable',
        type: 'system',
        indicator: 'orange',
        httpStatus: status
      }

    default:
      return {
        message: `Request failed with status ${status}`,
        title: 'Error',
        type: 'system',
        indicator: 'red',
        httpStatus: status
      }
  }
}

// ============================================================================
// Legacy Export (for backwards compatibility)
// ============================================================================

/**
 * Legacy function that returns string message
 * @deprecated Use parseFrappeError() which returns structured FrappeError
 */
export function parseFrappeErrorMessage(error: any): string {
  return parseFrappeError(error).message
}
