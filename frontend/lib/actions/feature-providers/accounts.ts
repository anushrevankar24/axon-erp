/**
 * Accounting Feature Providers
 * 
 * Provides DocType-specific actions for Accounting and Finance management.
 * Implements operations using official ERPNext Accounts APIs.
 * 
 * Based on ERPNext accounts module doctypes
 */

import type { ActionProvider, Action, ActionContext } from '../types'
import { makePaymentEntry, makeSalesInvoiceFromSalesOrder, makePurchaseInvoiceFromPurchaseOrder } from '@/lib/api/accounts-actions'
import { saveDocument } from '@/lib/api/document'

/**
 * Sales Invoice feature provider
 * Adds Sales Invoice-specific actions
 */
const salesInvoiceFeatureProvider: ActionProvider = {
  name: 'SalesInvoiceFeatureProvider',
  
  appliesTo: (doctype: string) => doctype === 'Sales Invoice',
  
  getActions: async (ctx: ActionContext): Promise<Action[]> => {
    const actions: Action[] = []
    const { doc } = ctx
    const isNew = !doc || doc.__islocal
    
    if (isNew || doc.docstatus !== 1) return actions
    
    // Make Payment Entry action
    actions.push({
      id: 'sales-invoice-make-payment',
      label: 'Make Payment',
      group: 'actions',
      priority: 200,
      icon: 'DollarSign',
      showAsMenuItem: true,
      requires: [
        { notNew: true },
        { docstatus: 1 }
      ],
      execute: async (ctx) => {
        const result = await makePaymentEntry({
          dt: ctx.doctype,
          dn: ctx.doc.name
        })
        
        if (result.success && result.doc) {
          // Save the payment entry
          const saveResult = await saveDocument(result.doc, 'Save')
          if (saveResult.success && saveResult.doc && ctx.navigate) {
            ctx.navigate(`/app/Payment Entry/${saveResult.doc.name}`)
          } else if (saveResult.error) {
            throw new Error(saveResult.error.message)
          }
        } else if (result.error) {
          throw new Error(result.error.message)
        }
      }
    })
    
    // View General Ledger action
    actions.push({
      id: 'sales-invoice-view-ledger',
      label: 'View Ledger',
      group: 'actions',
      priority: 201,
      icon: 'BookOpen',
      showAsMenuItem: true,
      requires: [
        { notNew: true },
        { docstatus: 1 }
      ],
      execute: async (ctx) => {
        if (ctx.navigate) {
          ctx.navigate(`/app/query-report/General Ledger?voucher_no=${encodeURIComponent(ctx.doc.name)}`)
        }
      }
    })
    
    return actions
  }
}

/**
 * Purchase Invoice feature provider
 * Adds Purchase Invoice-specific actions
 */
const purchaseInvoiceFeatureProvider: ActionProvider = {
  name: 'PurchaseInvoiceFeatureProvider',
  
  appliesTo: (doctype: string) => doctype === 'Purchase Invoice',
  
  getActions: async (ctx: ActionContext): Promise<Action[]> => {
    const actions: Action[] = []
    const { doc } = ctx
    const isNew = !doc || doc.__islocal
    
    if (isNew || doc.docstatus !== 1) return actions
    
    // Make Payment Entry action
    actions.push({
      id: 'purchase-invoice-make-payment',
      label: 'Make Payment',
      group: 'actions',
      priority: 200,
      icon: 'DollarSign',
      showAsMenuItem: true,
      requires: [
        { notNew: true },
        { docstatus: 1 }
      ],
      execute: async (ctx) => {
        const result = await makePaymentEntry({
          dt: ctx.doctype,
          dn: ctx.doc.name
        })
        
        if (result.success && result.doc) {
          const saveResult = await saveDocument(result.doc, 'Save')
          if (saveResult.success && saveResult.doc && ctx.navigate) {
            ctx.navigate(`/app/Payment Entry/${saveResult.doc.name}`)
          } else if (saveResult.error) {
            throw new Error(saveResult.error.message)
          }
        } else if (result.error) {
          throw new Error(result.error.message)
        }
      }
    })
    
    // View General Ledger action
    actions.push({
      id: 'purchase-invoice-view-ledger',
      label: 'View Ledger',
      group: 'actions',
      priority: 201,
      icon: 'BookOpen',
      showAsMenuItem: true,
      requires: [
        { notNew: true },
        { docstatus: 1 }
      ],
      execute: async (ctx) => {
        if (ctx.navigate) {
          ctx.navigate(`/app/query-report/General Ledger?voucher_no=${encodeURIComponent(ctx.doc.name)}`)
        }
      }
    })
    
    return actions
  }
}

/**
 * Payment Entry feature provider
 * Adds Payment Entry-specific actions
 */
const paymentEntryFeatureProvider: ActionProvider = {
  name: 'PaymentEntryFeatureProvider',
  
  appliesTo: (doctype: string) => doctype === 'Payment Entry',
  
  getActions: async (ctx: ActionContext): Promise<Action[]> => {
    const actions: Action[] = []
    const { doc } = ctx
    const isNew = !doc || doc.__islocal
    
    if (isNew || doc.docstatus !== 1) return actions
    
    // View Ledger action
    actions.push({
      id: 'payment-entry-view-ledger',
      label: 'View Ledger',
      group: 'actions',
      priority: 200,
      icon: 'BookOpen',
      showAsMenuItem: true,
      requires: [
        { notNew: true },
        { docstatus: 1 }
      ],
      execute: async (ctx) => {
        if (ctx.navigate) {
          ctx.navigate(`/app/query-report/General Ledger?voucher_no=${encodeURIComponent(ctx.doc.name)}`)
        }
      }
    })
    
    return actions
  }
}

/**
 * Journal Entry feature provider
 * Adds Journal Entry-specific actions
 */
const journalEntryFeatureProvider: ActionProvider = {
  name: 'JournalEntryFeatureProvider',
  
  appliesTo: (doctype: string) => doctype === 'Journal Entry',
  
  getActions: async (ctx: ActionContext): Promise<Action[]> => {
    const actions: Action[] = []
    const { doc } = ctx
    const isNew = !doc || doc.__islocal
    
    if (isNew || doc.docstatus !== 1) return actions
    
    // View Ledger action
    actions.push({
      id: 'journal-entry-view-ledger',
      label: 'View Ledger',
      group: 'actions',
      priority: 200,
      icon: 'BookOpen',
      showAsMenuItem: true,
      requires: [
        { notNew: true },
        { docstatus: 1 }
      ],
      execute: async (ctx) => {
        if (ctx.navigate) {
          ctx.navigate(`/app/query-report/General Ledger?voucher_no=${encodeURIComponent(ctx.doc.name)}`)
        }
      }
    })
    
    return actions
  }
}

/**
 * Account feature provider
 * Adds Account-specific actions
 */
const accountFeatureProvider: ActionProvider = {
  name: 'AccountFeatureProvider',
  
  appliesTo: (doctype: string) => doctype === 'Account',
  
  getActions: async (ctx: ActionContext): Promise<Action[]> => {
    const actions: Action[] = []
    const { doc } = ctx
    const isNew = !doc || doc.__islocal
    
    if (isNew) return actions
    
    // View Ledger action
    actions.push({
      id: 'account-view-ledger',
      label: 'View Ledger',
      group: 'actions',
      priority: 200,
      icon: 'BookOpen',
      showAsMenuItem: true,
      requires: [{ notNew: true }],
      execute: async (ctx) => {
        if (ctx.navigate) {
          ctx.navigate(`/app/query-report/General Ledger?account=${encodeURIComponent(ctx.doc.name)}`)
        }
      }
    })
    
    return actions
  }
}

/**
 * Export all accounting feature providers
 */
export const accountingFeatureProviders: ActionProvider[] = [
  salesInvoiceFeatureProvider,
  purchaseInvoiceFeatureProvider,
  paymentEntryFeatureProvider,
  journalEntryFeatureProvider,
  accountFeatureProvider,
]

