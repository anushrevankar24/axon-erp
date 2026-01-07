/**
 * Stock/Item Actions API - Official ERPNext Stock Methods
 * 
 * Provides wrappers around erpnext.stock.* methods
 * for stock and item management operations.
 * 
 * Based on ERPNext stock module APIs
 */

import { call } from './client'
import { parseFrappeError, type FrappeError } from '@/lib/utils/errors'

/**
 * Get stock balance for an item
 * 
 * Calls erpnext.stock.utils.get_stock_balance
 * 
 * @param item_code - Item code
 * @param warehouse - Warehouse name (optional)
 * @param posting_date - Date for stock calculation (optional)
 */
export async function getStockBalance(params: {
  item_code: string
  warehouse?: string
  posting_date?: string
}): Promise<{ success: boolean; qty?: number; error?: FrappeError }> {
  try {
    const result = await call('erpnext.stock.utils.get_stock_balance', params)
    
    return {
      success: true,
      qty: result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Get item details (used for fetching item info in transactions)
 * 
 * Calls erpnext.stock.get_item_details.get_item_details
 * 
 * @param args - Item details request args
 */
export async function getItemDetails(args: any): Promise<{ success: boolean; item?: any; error?: FrappeError }> {
  try {
    const result = await call('erpnext.stock.get_item_details.get_item_details', {
      args: JSON.stringify(args)
    })
    
    return {
      success: true,
      item: result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Scan barcode to get item
 * 
 * Calls erpnext.stock.utils.scan_barcode
 * 
 * @param barcode - Barcode string
 */
export async function scanBarcode(barcode: string): Promise<{ success: boolean; item?: any; error?: FrappeError }> {
  try {
    const result = await call('erpnext.stock.utils.scan_barcode', {
      barcode
    })
    
    return {
      success: true,
      item: result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Make Stock Entry from document
 * (e.g., from Purchase Receipt, Delivery Note)
 * 
 * Calls appropriate make_* method based on source doctype
 */
export async function makeStockEntry(params: {
  source_name: string
  target_doc?: any
  doctype?: string
}): Promise<{ success: boolean; doc?: any; error?: FrappeError }> {
  try {
    // This would call different methods based on source doctype
    // For now, a placeholder for the pattern
    const result = await call('erpnext.stock.doctype.stock_entry.stock_entry.make_stock_entry', params)
    
    return {
      success: true,
      doc: result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Make Delivery Note from Sales Order
 * 
 * Calls erpnext.selling.doctype.sales_order.sales_order.make_delivery_note
 */
export async function makeDeliveryNote(source_name: string): Promise<{ success: boolean; doc?: any; error?: FrappeError }> {
  try {
    const result = await call('erpnext.selling.doctype.sales_order.sales_order.make_delivery_note', {
      source_name
    })
    
    return {
      success: true,
      doc: result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Make Purchase Receipt from Purchase Order
 * 
 * Calls erpnext.buying.doctype.purchase_order.purchase_order.make_purchase_receipt
 */
export async function makePurchaseReceipt(source_name: string): Promise<{ success: boolean; doc?: any; error?: FrappeError }> {
  try {
    const result = await call('erpnext.buying.doctype.purchase_order.purchase_order.make_purchase_receipt', {
      source_name
    })
    
    return {
      success: true,
      doc: result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

