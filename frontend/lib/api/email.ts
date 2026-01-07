/**
 * Email/Communication API - Official Frappe Email Methods
 * 
 * Provides wrappers around frappe.core.doctype.communication.email.* methods
 * for composing and sending emails from documents.
 * 
 * Based on: frappe/core/doctype/communication/email.py
 */

import { call } from './client'
import { parseFrappeError, type FrappeError } from '@/lib/utils/errors'

/**
 * Email composition parameters
 */
export interface EmailParams {
  /** Recipients (comma-separated or array) */
  recipients?: string | string[]
  /** CC (comma-separated or array) */
  cc?: string | string[]
  /** BCC (comma-separated or array) */
  bcc?: string | string[]
  /** Email subject */
  subject?: string
  /** Email content (HTML) */
  content?: string
  /** DocType of the document */
  doctype?: string
  /** Document name */
  name?: string
  /** Send immediately (vs queue) */
  send_now?: boolean
  /** Print format to attach */
  print_format?: string
  /** Email template to use */
  email_template?: string
  /** Attachments */
  attachments?: any[]
  /** Read receipt */
  read_receipt?: boolean
  /** Print language */
  print_language?: string
}

/**
 * Compose/send email for a document
 * 
 * Calls frappe.core.doctype.communication.email.make
 * This is the standard Desk method for sending emails from documents
 * 
 * @param params - Email parameters
 */
export async function composeEmail(
  params: EmailParams
): Promise<{ success: boolean; communication?: any; error?: FrappeError }> {
  try {
    // Normalize recipients to comma-separated string if array
    const normalizedParams = {
      ...params,
      recipients: Array.isArray(params.recipients) ? params.recipients.join(', ') : params.recipients,
      cc: Array.isArray(params.cc) ? params.cc.join(', ') : params.cc,
      bcc: Array.isArray(params.bcc) ? params.bcc.join(', ') : params.bcc,
    }
    
    const result = await call('frappe.core.doctype.communication.email.make', normalizedParams)
    
    return {
      success: true,
      communication: result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Get email template for a doctype
 * 
 * Fetches available email templates
 * 
 * @param doctype - DocType name
 */
export async function getEmailTemplates(
  doctype: string
): Promise<{ success: boolean; templates?: any[]; error?: FrappeError }> {
  try {
    const result = await call('frappe.email.doctype.email_template.email_template.get_email_template', {
      doctype
    })
    
    return {
      success: true,
      templates: result.message || []
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Send email (simple wrapper for immediate send)
 * 
 * @param recipients - Email recipients
 * @param subject - Email subject
 * @param message - Email body (HTML)
 * @param reference_doctype - Related doctype
 * @param reference_name - Related document name
 */
export async function sendEmail(params: {
  recipients: string | string[]
  subject: string
  message: string
  reference_doctype?: string
  reference_name?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: any[]
}): Promise<{ success: boolean; error?: FrappeError }> {
  try {
    await call('frappe.sendmail', {
      recipients: Array.isArray(params.recipients) ? params.recipients.join(', ') : params.recipients,
      subject: params.subject,
      message: params.message,
      reference_doctype: params.reference_doctype,
      reference_name: params.reference_name,
      cc: Array.isArray(params.cc) ? params.cc.join(', ') : params.cc,
      bcc: Array.isArray(params.bcc) ? params.bcc.join(', ') : params.bcc,
      attachments: params.attachments ? JSON.stringify(params.attachments) : undefined,
    })
    
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Get document email (for email-to-document functionality)
 * 
 * Returns the email address that can be used to create/update this document via email
 * This is populated in docinfo.document_email
 * 
 * @param doctype - DocType name
 * @param name - Document name
 */
export function getDocumentEmail(docinfo: any): string | null {
  return docinfo?.document_email || null
}

