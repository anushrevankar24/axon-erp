/**
 * Client-Side Validation Utilities
 * 
 * Ported from Frappe's validation logic:
 * - frappe/public/js/frappe/form/save.js (check_mandatory)
 * - frappe/model/base_document.py (_get_missing_mandatory_fields, _validate_data_fields)
 * 
 * This validates on client before server call, just like ERPNext.
 */

import type { UseFormReturn } from 'react-hook-form'

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  firstErrorField?: string
}

export interface ValidationError {
  fieldname: string
  label: string
  message: string
  type: 'mandatory' | 'format' | 'length' | 'custom'
  row?: number  // For child table errors
  tableName?: string  // For child table errors
}

export interface FieldMeta {
  fieldname: string
  fieldtype: string
  label: string
  reqd?: number | boolean
  read_only?: number | boolean
  hidden?: number | boolean
  mandatory_depends_on?: string
  options?: string
  length?: number
}

// Field types that don't hold data values
const NO_VALUE_FIELDTYPES = [
  'Section Break',
  'Column Break',
  'Tab Break',
  'HTML',
  'Heading',
  'Button',
  'Fold',
  'Image'
]

// ============================================================================
// Null/Empty Check (matches Frappe's is_null)
// ============================================================================

/**
 * Check if a value is null or empty
 * Matches Frappe's is_null() function behavior
 */
export function isNullOrEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (value === '') return true
  if (value === 0) return false  // 0 is a valid value
  if (Array.isArray(value) && value.length === 0) return true
  if (typeof value === 'string' && value.trim() === '') return true
  return false
}

/**
 * Check if a field type holds data values
 */
function isDataField(fieldtype: string): boolean {
  return !NO_VALUE_FIELDTYPES.includes(fieldtype)
}

// ============================================================================
// Mandatory Field Validation
// ============================================================================

/**
 * Check mandatory fields before submission
 * Ported from frappe.ui.form.check_mandatory in save.js
 * 
 * @param meta - DocType metadata with fields
 * @param formData - Current form data
 * @param form - Optional react-hook-form instance to set errors
 */
export function checkMandatory(
  meta: { fields: FieldMeta[]; istable?: boolean; autoname?: string },
  formData: Record<string, any>,
  form?: UseFormReturn<any>
): ValidationResult {
  const errors: ValidationError[] = []
  let firstErrorField: string | undefined

  // Skip if document is cancelled (docstatus == 2)
  if (formData.docstatus === 2) {
    return { valid: true, errors: [] }
  }

  const fields = meta.fields || []

  // Check main document fields
  for (const field of fields) {
    // Skip fields that don't hold data
    if (!isDataField(field.fieldtype)) continue

    // Skip read-only and hidden fields
    if (field.read_only || field.hidden) continue

    // Check if field is mandatory
    const isMandatory = isFieldMandatory(field, formData)

    if (isMandatory && isNullOrEmpty(formData[field.fieldname])) {
      const error: ValidationError = {
        fieldname: field.fieldname,
        label: field.label || field.fieldname,
        message: `${field.label || field.fieldname} is required`,
        type: 'mandatory'
      }
      errors.push(error)

      // Track first error field for scrolling
      if (!firstErrorField) {
        firstErrorField = field.fieldname
      }

      // Set error in react-hook-form if provided
      if (form) {
        form.setError(field.fieldname, {
          type: 'required',
          message: error.message
        })
      }
    }

    // Check child tables
    if (field.fieldtype === 'Table' && field.reqd) {
      const tableData = formData[field.fieldname]
      if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
        const error: ValidationError = {
          fieldname: field.fieldname,
          label: field.label || field.fieldname,
          message: `Table ${field.label || field.fieldname} cannot be empty`,
          type: 'mandatory'
        }
        errors.push(error)

        if (!firstErrorField) {
          firstErrorField = field.fieldname
        }

        if (form) {
          form.setError(field.fieldname, {
            type: 'required',
            message: error.message
          })
        }
      }
    }
  }

  // Check for Prompt autoname (name field required for new docs)
  if (meta.autoname === 'Prompt' && !formData.name && !formData.__newname) {
    const error: ValidationError = {
      fieldname: '__newname',
      label: 'Name',
      message: 'Name is required',
      type: 'mandatory'
    }
    errors.unshift(error)  // Add at beginning
    if (!firstErrorField) {
      firstErrorField = '__newname'
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    firstErrorField
  }
}

/**
 * Check if a field is mandatory
 * Handles reqd flag and mandatory_depends_on expressions
 */
function isFieldMandatory(field: FieldMeta, doc: Record<string, any>): boolean {
  // Simple reqd flag
  if (field.reqd) return true

  // Check mandatory_depends_on expression
  if (!field.mandatory_depends_on) return false

  const expression = field.mandatory_depends_on

  // Boolean value
  if (typeof expression === 'boolean') {
    return expression
  }

  // Simple field reference (e.g., "is_active")
  if (typeof expression === 'string' && !expression.startsWith('eval:')) {
    const value = doc[expression]
    if (Array.isArray(value)) {
      return value.length > 0
    }
    return !!value
  }

  // eval: expression - simplified evaluation
  // For full Frappe compatibility, complex expressions should be validated server-side
  if (typeof expression === 'string' && expression.startsWith('eval:')) {
    try {
      const evalStr = expression.substring(5)
      // Simple expression evaluation - replace doc references
      const result = evaluateExpression(evalStr, doc)
      return !!result
    } catch (e) {
      console.warn('Failed to evaluate mandatory_depends_on:', expression, e)
      return false
    }
  }

  return false
}

/**
 * Simple expression evaluator for mandatory_depends_on
 * Handles basic patterns like: doc.field_name, doc.field == 'value'
 */
function evaluateExpression(expression: string, doc: Record<string, any>): boolean {
  try {
    // Replace doc. references with actual values
    const processedExpr = expression.replace(/doc\.(\w+)/g, (_, fieldname) => {
      const value = doc[fieldname]
      if (value === null || value === undefined) return 'null'
      if (typeof value === 'string') return JSON.stringify(value)
      if (typeof value === 'boolean') return value ? 'true' : 'false'
      return String(value)
    })

    // Use Function constructor for safe evaluation (no access to outer scope)
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return ${processedExpr}`)
    return fn()
  } catch {
    return false
  }
}

// ============================================================================
// Data Field Validation
// ============================================================================

/**
 * Validate data field formats (email, phone, URL, etc.)
 * Ported from frappe's _validate_data_fields
 */
export function validateDataFields(
  meta: { fields: FieldMeta[] },
  formData: Record<string, any>
): ValidationResult {
  const errors: ValidationError[] = []
  let firstErrorField: string | undefined

  for (const field of meta.fields || []) {
    const value = formData[field.fieldname]

    // Skip empty values (mandatory check handles required fields)
    if (isNullOrEmpty(value)) continue

    // Validate based on field type and options
    if (field.fieldtype === 'Data' && field.options) {
      const validationError = validateDataOption(field, value)
      if (validationError) {
        errors.push(validationError)
        if (!firstErrorField) {
          firstErrorField = field.fieldname
        }
      }
    }

    // Validate field length
    if (field.length && typeof value === 'string' && value.length > field.length) {
      errors.push({
        fieldname: field.fieldname,
        label: field.label || field.fieldname,
        message: `${field.label} exceeds maximum length of ${field.length} characters`,
        type: 'length'
      })
      if (!firstErrorField) {
        firstErrorField = field.fieldname
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    firstErrorField
  }
}

/**
 * Validate Data field with specific options (Email, Phone, URL, etc.)
 */
function validateDataOption(field: FieldMeta, value: string): ValidationError | null {
  const options = field.options

  switch (options) {
    case 'Email':
      if (!isValidEmail(value)) {
        return {
          fieldname: field.fieldname,
          label: field.label || field.fieldname,
          message: `${field.label} is not a valid email address`,
          type: 'format'
        }
      }
      break

    case 'Phone':
      if (!isValidPhone(value)) {
        return {
          fieldname: field.fieldname,
          label: field.label || field.fieldname,
          message: `${field.label} is not a valid phone number`,
          type: 'format'
        }
      }
      break

    case 'URL':
      if (!isValidURL(value)) {
        return {
          fieldname: field.fieldname,
          label: field.label || field.fieldname,
          message: `${field.label} is not a valid URL`,
          type: 'format'
        }
      }
      break

    case 'Name':
      if (!isValidName(value)) {
        return {
          fieldname: field.fieldname,
          label: field.label || field.fieldname,
          message: `${field.label} contains invalid characters`,
          type: 'format'
        }
      }
      break
  }

  return null
}

// ============================================================================
// Format Validators
// ============================================================================

/**
 * Validate email address format
 * Based on Frappe's validate_email_address
 */
export function isValidEmail(email: string): boolean {
  // Handle comma-separated emails
  const emails = email.split(',').map(e => e.trim())
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emails.every(e => emailRegex.test(e))
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  // Allow digits, spaces, dashes, parentheses, and plus sign
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate name format (no special characters that could cause issues)
 */
export function isValidName(name: string): boolean {
  // Disallow characters that could cause issues in Frappe naming
  const invalidChars = /[<>]/
  return !invalidChars.test(name)
}

// ============================================================================
// Combined Validation
// ============================================================================

/**
 * Run all validations on form data
 * Returns combined result with all errors
 */
export function validateForm(
  meta: { fields: FieldMeta[]; istable?: boolean; autoname?: string },
  formData: Record<string, any>,
  form?: UseFormReturn<any>
): ValidationResult {
  // Run mandatory check
  const mandatoryResult = checkMandatory(meta, formData, form)

  // Run data field validation
  const dataResult = validateDataFields(meta, formData)

  // Combine results
  const allErrors = [...mandatoryResult.errors, ...dataResult.errors]
  const firstErrorField = mandatoryResult.firstErrorField || dataResult.firstErrorField

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    firstErrorField
  }
}

// ============================================================================
// Child Table Validation
// ============================================================================

/**
 * Validate child table rows
 * 
 * @param tableMeta - Child table DocType metadata
 * @param rows - Array of row data
 * @param tableFieldname - Parent field name
 * @param tableLabel - Parent field label
 */
export function validateChildTable(
  tableMeta: { fields: FieldMeta[] },
  rows: Record<string, any>[],
  tableFieldname: string,
  tableLabel: string
): ValidationError[] {
  const errors: ValidationError[] = []

  rows.forEach((row, index) => {
    const rowResult = checkMandatory(tableMeta, row)

    for (const error of rowResult.errors) {
      errors.push({
        ...error,
        message: `Row ${index + 1}: ${error.message}`,
        row: index + 1,
        tableName: tableLabel,
        fieldname: `${tableFieldname}.${index}.${error.fieldname}`
      })
    }
  })

  return errors
}

// ============================================================================
// Error Message Formatting
// ============================================================================

/**
 * Format validation errors into a user-friendly message
 * Matches Frappe's msgprint format for missing fields
 */
export function formatValidationErrors(
  errors: ValidationError[],
  doctype?: string
): { title: string; message: string } {
  const mandatoryErrors = errors.filter(e => e.type === 'mandatory')
  const otherErrors = errors.filter(e => e.type !== 'mandatory')

  let message = ''

  if (mandatoryErrors.length > 0) {
    const fields = mandatoryErrors.map(e => e.label)
    message = doctype
      ? `Mandatory fields required in ${doctype}`
      : 'Mandatory fields required'
    message += '<br><br><ul><li>' + fields.join('</li><li>') + '</li></ul>'
  }

  if (otherErrors.length > 0) {
    if (message) message += '<br><br>'
    message += otherErrors.map(e => e.message).join('<br>')
  }

  return {
    title: mandatoryErrors.length > 0 ? 'Missing Fields' : 'Validation Error',
    message
  }
}

