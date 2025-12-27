/**
 * Parse Frappe error response into user-friendly message
 * Based on ERPNext's error handling pattern from frappe/public/js/frappe/request.js
 */
export function parseFrappeError(error: any): string {
  const responseData = error.response?.data || error
  
  // 1. Try _server_messages (highest priority - user-friendly messages)
  if (responseData._server_messages) {
    const parsed = parseServerMessages(responseData._server_messages)
    if (parsed) return parsed
  }
  
  // 2. Try exception field
  if (responseData.exception) {
    return parseException(responseData.exception)
  }
  
  // 3. Try _error_message
  if (responseData._error_message) {
    return responseData._error_message
  }
  
  // 4. Fallback to error message
  if (error.message) {
    return error.message
  }
  
  return 'Operation failed'
}

/**
 * Parse _server_messages field (JSON array of messages)
 */
function parseServerMessages(serverMessages: string): string | null {
  try {
    const messages = JSON.parse(serverMessages)
    if (Array.isArray(messages)) {
      const parsedMessages = messages
        .map(msg => {
          try {
            // Each message might itself be a JSON string
            const parsed = JSON.parse(msg)
            return parsed.message || parsed
          } catch {
            // If not JSON, use as-is
            return msg
          }
        })
        .filter(Boolean)
      
      if (parsedMessages.length > 0) {
        return parsedMessages.join('\n')
      }
    } else {
      return messages
    }
  } catch (e) {
    console.error('Failed to parse _server_messages:', e)
  }
  
  return null
}

/**
 * Parse exception string to extract readable error message
 */
function parseException(exceptionStr: string): string {
  // Extract the last line which is usually the most readable
  const parts = exceptionStr.split('\n')
  const lastLine = parts[parts.length - 1].trim()
  
  // Try to extract the error type and message
  if (lastLine.includes(':')) {
    const colonIndex = lastLine.indexOf(':')
    const errorTypeFull = lastLine.substring(0, colonIndex)
    const errorDetails = lastLine.substring(colonIndex + 1).trim()
    
    // Extract just the error class name (e.g., "UniqueValidationError" from "frappe.exceptions.UniqueValidationError")
    const errorType = errorTypeFull.split('.').pop() || ''
    
    // Format specific error types
    return formatErrorType(errorType, errorDetails)
  }
  
  return lastLine
}

/**
 * Format specific error types into user-friendly messages
 */
function formatErrorType(errorType: string, errorDetails: string): string {
  switch (errorType) {
    case 'UniqueValidationError':
      return formatUniqueValidationError(errorDetails)
    
    case 'ValidationError':
      return formatValidationError(errorDetails)
    
    case 'MandatoryError':
      return formatMandatoryError(errorDetails)
    
    case 'LinkValidationError':
      return errorDetails.replace(/[\(\)']/g, '').trim() || 'Invalid link value'
    
    case 'PermissionError':
      return 'You do not have permission to perform this action'
    
    case 'DoesNotExistError':
      return errorDetails.replace(/[\(\)']/g, '').trim() || 'Record does not exist'
    
    case 'DuplicateEntryError':
      return formatUniqueValidationError(errorDetails)
    
    default:
      // Generic error type - make it readable
      const readableType = errorType.replace(/([A-Z])/g, ' $1').trim()
      const cleanDetails = errorDetails.replace(/[\(\)']/g, '').trim()
      return cleanDetails || readableType
  }
}

/**
 * Format UniqueValidationError into readable message
 * Input: "('Bank', 'Canara', IntegrityError(1062, "Duplicate entry '34365557' for key 'swift_number'"))"
 * Output: "Duplicate value for swift number"
 */
function formatUniqueValidationError(errorDetails: string): string {
  if (errorDetails.includes('Duplicate entry')) {
    // Try to extract the field name from "for key 'field_name'"
    const fieldMatch = errorDetails.match(/for key '([^']+)'/)
    if (fieldMatch) {
      const fieldName = fieldMatch[1]
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize each word
      return `Duplicate value for ${fieldName}`
    }
    return 'Duplicate entry - this value already exists'
  }
  
  return errorDetails.replace(/[\(\)']/g, '').trim() || 'Duplicate entry detected'
}

/**
 * Format ValidationError into readable message
 */
function formatValidationError(errorDetails: string): string {
  const cleaned = errorDetails.replace(/[\(\)']/g, '').trim()
  return cleaned || 'Validation error'
}

/**
 * Format MandatoryError into readable message
 * Input: "('Item Code')"
 * Output: "Item Code is mandatory"
 */
function formatMandatoryError(errorDetails: string): string {
  const cleaned = errorDetails.replace(/[\(\)']/g, '').trim()
  if (cleaned) {
    // If it's a field name, add "is mandatory"
    if (!cleaned.toLowerCase().includes('mandatory') && !cleaned.toLowerCase().includes('required')) {
      return `${cleaned} is mandatory`
    }
    return cleaned
  }
  return 'Please fill all mandatory fields'
}

