/**
 * Workflow API - Official Frappe Workflow Methods
 * 
 * Provides wrappers around frappe.model.workflow.* methods
 * for workflow state management and transitions.
 * 
 * Based on: frappe/model/workflow.py
 */

import { call } from './client'
import { parseFrappeError, type FrappeError } from '@/lib/utils/errors'
import type { WorkflowTransition } from '@/lib/actions/types'

/**
 * Get available workflow transitions for a document
 * 
 * Calls frappe.model.workflow.get_transitions
 * Returns the allowed workflow actions based on:
 * - Current workflow state
 * - User roles
 * - Transition conditions
 * 
 * @param doc - Document object (must have doctype, name, and workflow_state if applicable)
 * @param workflow - Optional workflow name (auto-detected if not provided)
 */
export async function getWorkflowTransitions(
  doc: Record<string, any>,
  workflow?: string
): Promise<{ success: boolean; transitions?: WorkflowTransition[]; error?: FrappeError }> {
  try {
    const result = await call('frappe.model.workflow.get_transitions', {
      doc: JSON.stringify(doc),
      workflow
    })
    
    // Result is an array of transition objects
    const transitions = result.message || []
    
    return {
      success: true,
      transitions: transitions as WorkflowTransition[]
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Apply a workflow action to a document
 * 
 * Calls frappe.model.workflow.apply_workflow
 * Transitions the document to a new state based on the action.
 * 
 * @param doc - Document object
 * @param action - Workflow action name
 */
export async function applyWorkflow(
  doc: Record<string, any>,
  action: string
): Promise<{ success: boolean; doc?: any; error?: FrappeError }> {
  try {
    const result = await call('frappe.model.workflow.apply_workflow', {
      doc: JSON.stringify(doc),
      action
    })
    
    return {
      success: true,
      doc: result.message || result.docs?.[0]
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Check if a document can be cancelled (considering workflow)
 * 
 * Calls frappe.model.workflow.can_cancel_document
 * 
 * @param doctype - DocType name
 * @param name - Document name
 */
export async function canCancelDocument(
  doctype: string,
  name: string
): Promise<{ success: boolean; canCancel?: boolean; error?: FrappeError }> {
  try {
    const result = await call('frappe.model.workflow.can_cancel_document', {
      doctype,
      name
    })
    
    return {
      success: true,
      canCancel: !!result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Get common workflow transition actions across multiple documents
 * Useful for bulk workflow actions
 * 
 * Calls frappe.model.workflow.get_common_transition_actions
 * 
 * @param doctype - DocType name
 * @param docnames - Array of document names
 */
export async function getCommonTransitionActions(
  doctype: string,
  docnames: string[]
): Promise<{ success: boolean; actions?: string[]; error?: FrappeError }> {
  try {
    const result = await call('frappe.model.workflow.get_common_transition_actions', {
      doctype,
      docnames: JSON.stringify(docnames)
    })
    
    return {
      success: true,
      actions: result.message || []
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Apply workflow action to multiple documents (bulk operation)
 * 
 * Calls frappe.model.workflow.bulk_workflow_approval
 * 
 * @param doctype - DocType name
 * @param docnames - Array of document names
 * @param action - Workflow action to apply
 */
export async function bulkWorkflowApproval(
  doctype: string,
  docnames: string[],
  action: string
): Promise<{ success: boolean; error?: FrappeError }> {
  try {
    await call('frappe.model.workflow.bulk_workflow_approval', {
      doctype,
      docnames: JSON.stringify(docnames),
      action
    })
    
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

