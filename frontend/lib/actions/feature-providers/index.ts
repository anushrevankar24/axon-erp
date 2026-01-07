/**
 * Feature Action Providers Registry
 * 
 * DocType-specific action providers that extend the core actions
 * with module/doctype-specific capabilities using official APIs.
 */

import type { ActionProvider, ActionContext, Action } from '../types'
import { userFeatureProvider } from './user'
import { stockFeatureProviders } from './stock'
import { accountingFeatureProviders } from './accounts'

/**
 * Registry of all feature providers
 */
const featureProviders: ActionProvider[] = [
  userFeatureProvider,
  ...stockFeatureProviders,
  ...accountingFeatureProviders,
]

/**
 * Get feature actions for a document
 * Composes actions from all applicable providers
 */
export async function getFeatureActions(ctx: ActionContext): Promise<Action[]> {
  const allActions: Action[] = []
  
  for (const provider of featureProviders) {
    // Check if provider applies to this doctype
    if (provider.appliesTo && !provider.appliesTo(ctx.doctype)) {
      continue
    }
    
    try {
      const actions = await provider.getActions(ctx)
      allActions.push(...actions)
    } catch (error) {
      console.error(`[FeatureProvider] Error in ${provider.name}:`, error)
      // Continue with other providers
    }
  }
  
  return allActions
}

/**
 * Register a feature provider
 */
export function registerFeatureProvider(provider: ActionProvider): void {
  featureProviders.push(provider)
}

/**
 * Get all registered feature providers
 */
export function getFeatureProviders(): readonly ActionProvider[] {
  return featureProviders
}

