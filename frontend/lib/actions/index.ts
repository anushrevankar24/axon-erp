/**
 * DocType Action System - Main Entry Point
 * 
 * Central registry for composing actions from core + feature providers.
 */

import type { ActionContext, ActionManifest, Action } from './types'
import { getCoreActions } from './core-provider'
import { getFeatureActions } from './feature-providers'
import { sortActions } from './types'

/**
 * Build complete action manifest for a document
 * Combines core actions + feature-specific actions
 */
export async function buildActionManifest(ctx: ActionContext): Promise<ActionManifest> {
  const coreActions = await getCoreActions(ctx)
  const featureActions = await getFeatureActions(ctx)
  
  const allActions = [...coreActions, ...featureActions]
  const sortedActions = sortActions(allActions)
  
  return {
    actions: sortedActions,
    context: ctx
  }
}

/**
 * Get all actions for a document (convenience wrapper)
 */
export async function getActions(ctx: ActionContext): Promise<Action[]> {
  const manifest = await buildActionManifest(ctx)
  return manifest.actions
}

// Re-export types and utilities
export * from './types'
export { getCoreActions } from './core-provider'
export { getFeatureActions, registerFeatureProvider } from './feature-providers'

