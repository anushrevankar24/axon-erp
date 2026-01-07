/**
 * Accounting Actions API - Official ERPNext Accounts Methods
 * 
 * Provides wrappers around erpnext.accounts.* methods
 * for accounting and financial operations.
 * 
 * Based on ERPNext accounts module APIs
 */

import { call } from './client'
import { parseFrappeError, type FrappeError } from '@/lib/utils/errors'

/**
 * Get party details (Customer/Supplier)
 * 
 * Calls erpnext.accounts.party.get_party_details
 */
export async function getPartyDetails(params: {
  party?: string
  party_type?: string
  company?: string
  posting_date?: string
  price_list?: string
  currency?: string
  doctype?: string
}): Promise<{ success: boolean; details?: any; error?: FrappeError }> {
  try {
    const result = await call('erpnext.accounts.party.get_party_details', params)
    
    return {
      success: true,
      details: result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Get payment terms template
 * 
 * Calls erpnext.accounts.party.get_payment_terms_template
 */
export async function getPaymentTermsTemplate(params: {
  terms_template?: string
  posting_date?: string
  grand_total?: number
  base_grand_total?: number
  bill_date?: string
}): Promise<{ success: boolean; terms?: any; error?: FrappeError }> {
  try {
    const result = await call('erpnext.accounts.party.get_payment_terms_template', params)
    
    return {
      success: true,
      terms: result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Make Sales Invoice from Sales Order
 * 
 * Calls erpnext.selling.doctype.sales_order.sales_order.make_sales_invoice
 */
export async function makeSalesInvoiceFromSalesOrder(source_name: string): Promise<{ success: boolean; doc?: any; error?: FrappeError }> {
  try {
    const result = await call('erpnext.selling.doctype.sales_order.sales_order.make_sales_invoice', {
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
 * Make Purchase Invoice from Purchase Order
 * 
 * Calls erpnext.buying.doctype.purchase_order.purchase_order.make_purchase_invoice
 */
export async function makePurchaseInvoiceFromPurchaseOrder(source_name: string): Promise<{ success: boolean; doc?: any; error?: FrappeError }> {
  try {
    const result = await call('erpnext.buying.doctype.purchase_order.purchase_order.make_purchase_invoice', {
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
 * Make Payment Entry for an invoice
 * 
 * Calls erpnext.accounts.doctype.payment_entry.payment_entry.get_payment_entry
 */
export async function makePaymentEntry(params: {
  dt: string
  dn: string
  party_amount?: number
  bank_account?: string
  bank_amount?: number
}): Promise<{ success: boolean; doc?: any; error?: FrappeError }> {
  try {
    const result = await call('erpnext.accounts.doctype.payment_entry.payment_entry.get_payment_entry', params)
    
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
 * Get fiscal year
 * 
 * Calls erpnext.accounts.utils.get_fiscal_year
 */
export async function getFiscalYear(params: {
  date?: string
  company?: string
  as_dict?: boolean
}): Promise<{ success: boolean; fiscal_year?: any; error?: FrappeError }> {
  try {
    const result = await call('erpnext.accounts.utils.get_fiscal_year', params)
    
    return {
      success: true,
      fiscal_year: result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

/**
 * Get balance on a date for an account
 * 
 * Calls erpnext.accounts.utils.get_balance_on
 */
export async function getBalanceOn(params: {
  account?: string
  date?: string
  party_type?: string
  party?: string
  company?: string
  in_account_currency?: boolean
}): Promise<{ success: boolean; balance?: number; error?: FrappeError }> {
  try {
    const result = await call('erpnext.accounts.utils.get_balance_on', params)
    
    return {
      success: true,
      balance: result.message
    }
  } catch (error: any) {
    return {
      success: false,
      error: parseFrappeError(error)
    }
  }
}

