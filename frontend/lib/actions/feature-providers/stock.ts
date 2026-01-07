/**
 * Stock/Item Feature Providers
 * 
 * Provides DocType-specific actions for Stock and Item management.
 * Implements operations using official ERPNext Stock APIs.
 * 
 * Based on ERPNext stock module doctypes
 */

import type { ActionProvider, Action, ActionContext } from '../types'
import { getStockBalance, makeDeliveryNote, makePurchaseReceipt } from '@/lib/api/stock-actions'
import { saveDocument } from '@/lib/api/document'

/**
 * Item feature provider
 * Adds Item-specific actions
 */
const itemFeatureProvider: ActionProvider = {
  name: 'ItemFeatureProvider',
  
  appliesTo: (doctype: string) => doctype === 'Item',
  
  getActions: async (ctx: ActionContext): Promise<Action[]> => {
    const actions: Action[] = []
    const { doc } = ctx
    const isNew = !doc || doc.__islocal
    
    if (isNew) return actions
    
    // View Stock Balance action
    actions.push({
      id: 'item-stock-balance',
      label: 'View Stock Balance',
      group: 'actions',
      priority: 200,
      icon: 'Package',
      showAsMenuItem: true,
      requires: [{ notNew: true }],
      execute: async (ctx) => {
        if (ctx.navigate) {
          ctx.navigate(`/app/query-report/Stock Balance?item_code=${encodeURIComponent(ctx.doc.item_code || ctx.doc.name)}`)
        }
      }
    })
    
    // View Stock Ledger action
    actions.push({
      id: 'item-stock-ledger',
      label: 'View Stock Ledger',
      group: 'actions',
      priority: 201,
      icon: 'BookOpen',
      showAsMenuItem: true,
      requires: [{ notNew: true }],
      execute: async (ctx) => {
        if (ctx.navigate) {
          ctx.navigate(`/app/query-report/Stock Ledger?item_code=${encodeURIComponent(ctx.doc.item_code || ctx.doc.name)}`)
        }
      }
    })
    
    return actions
  }
}

/**
 * Delivery Note feature provider
 * Adds Delivery Note-specific actions
 */
const deliveryNoteFeatureProvider: ActionProvider = {
  name: 'DeliveryNoteFeatureProvider',
  
  appliesTo: (doctype: string) => doctype === 'Delivery Note',
  
  getActions: async (ctx: ActionContext): Promise<Action[]> => {
    const actions: Action[] = []
    const { doc } = ctx
    const isNew = !doc || doc.__islocal
    
    if (isNew || doc.docstatus !== 1) return actions
    
    // Make Sales Invoice action
    actions.push({
      id: 'delivery-note-make-invoice',
      label: 'Make Sales Invoice',
      group: 'actions',
      priority: 200,
      icon: 'FileText',
      showAsMenuItem: true,
      requires: [
        { notNew: true },
        { docstatus: 1 }
      ],
      execute: async (ctx) => {
        // TODO: Call appropriate make_sales_invoice method
        console.log('Make Sales Invoice from Delivery Note - implement API wrapper')
      }
    })
    
    return actions
  }
}

/**
 * Purchase Receipt feature provider
 * Adds Purchase Receipt-specific actions
 */
const purchaseReceiptFeatureProvider: ActionProvider = {
  name: 'PurchaseReceiptFeatureProvider',
  
  appliesTo: (doctype: string) => doctype === 'Purchase Receipt',
  
  getActions: async (ctx: ActionContext): Promise<Action[]> => {
    const actions: Action[] = []
    const { doc } = ctx
    const isNew = !doc || doc.__islocal
    
    if (isNew || doc.docstatus !== 1) return actions
    
    // Make Purchase Invoice action
    actions.push({
      id: 'purchase-receipt-make-invoice',
      label: 'Make Purchase Invoice',
      group: 'actions',
      priority: 200,
      icon: 'FileText',
      showAsMenuItem: true,
      requires: [
        { notNew: true },
        { docstatus: 1 }
      ],
      execute: async (ctx) => {
        // TODO: Call appropriate make_purchase_invoice method
        console.log('Make Purchase Invoice from Purchase Receipt - implement API wrapper')
      }
    })
    
    return actions
  }
}

/**
 * Stock Entry feature provider
 * Adds Stock Entry-specific actions
 */
const stockEntryFeatureProvider: ActionProvider = {
  name: 'StockEntryFeatureProvider',
  
  appliesTo: (doctype: string) => doctype === 'Stock Entry',
  
  getActions: async (ctx: ActionContext): Promise<Action[]> => {
    const actions: Action[] = []
    // Stock Entry typically doesn't have many custom actions
    // Most operations are handled through core actions
    return actions
  }
}

/**
 * Export all stock feature providers
 */
export const stockFeatureProviders: ActionProvider[] = [
  itemFeatureProvider,
  deliveryNoteFeatureProvider,
  purchaseReceiptFeatureProvider,
  stockEntryFeatureProvider,
]

