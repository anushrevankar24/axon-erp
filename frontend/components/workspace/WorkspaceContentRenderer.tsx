'use client'

import React from 'react'
import { ShortcutCard } from './ShortcutCard'
import { LinkCard } from './LinkCard'
import { NumberCardItem } from './NumberCardItem'
import { Card } from '@/components/ui/card'
import type {
  Workspace,
  WorkspaceDetails,
  WorkspaceShortcut,
  WorkspaceCard,
  WorkspaceNumberCard,
  WorkspaceChart,
  WorkspaceQuickList,
} from '@/lib/types/workspace'

type WorkspaceBlock =
  | { type: 'header'; data: { text?: string; col?: number } }
  | { type: 'paragraph'; data: { text?: string; col?: number } }
  | { type: 'spacer'; data: { col?: number } }
  | { type: 'shortcut'; data: { shortcut_name?: string; col?: number } }
  | { type: 'card'; data: { card_name?: string; col?: number } }
  | { type: 'number_card'; data: { number_card_name?: string; col?: number } }
  | { type: 'chart'; data: { chart_name?: string; col?: number } }
  | { type: 'quick_list'; data: { quick_list_name?: string; col?: number } }
  | { type: 'custom_block'; data: { custom_block_name?: string; col?: number } }
  | { type: 'onboarding'; data: { onboarding_name?: string; col?: number } }
  | { type: string; data?: any }

function safeParseBlocks(content: string | undefined | null): WorkspaceBlock[] | null {
  if (!content) return null
  try {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? (parsed as WorkspaceBlock[]) : null
  } catch {
    return null
  }
}

function stripHtml(input: string): string {
  // Desk stores header/paragraph as HTML strings in Workspace.content.
  // For security, we render as plain text (Desk uses trusted HTML; custom UIs should not).
  return input
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeLabel(s: string): string {
  return stripHtml(s).toLowerCase().trim()
}

function colSpanClass(col?: number): string {
  // Desk uses a bootstrap-like 12-col grid with responsive fallbacks.
  // We mirror its intent with Tailwind classes using an explicit mapping
  // (avoids dynamic class generation that Tailwind would purge).
  const c = typeof col === 'number' ? col : parseInt(String(col || 12), 10)
  switch (c) {
    case 1:
      return 'col-span-12 sm:col-span-6 md:col-span-3 lg:col-span-1'
    case 2:
      return 'col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2'
    case 3:
      return 'col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3'
    case 4:
      return 'col-span-12 sm:col-span-6 md:col-span-4'
    case 5:
      return 'col-span-12 sm:col-span-5'
    case 6:
      return 'col-span-12 sm:col-span-6'
    case 7:
      return 'col-span-12 lg:col-span-7'
    case 8:
      return 'col-span-12 lg:col-span-8'
    case 9:
      return 'col-span-12 lg:col-span-9'
    case 10:
      return 'col-span-12 lg:col-span-10'
    case 11:
      return 'col-span-12 lg:col-span-11'
    case 12:
    default:
      return 'col-span-12'
  }
}

function findByLabel<T extends { label?: string }>(
  items: T[] | undefined,
  label: string | undefined,
): T | undefined {
  if (!items || !label) return undefined
  const needle = normalizeLabel(label)
  return items.find((it) => it.label && normalizeLabel(it.label) === needle)
}

function findChart(items: WorkspaceChart[] | undefined, key: string | undefined): WorkspaceChart | undefined {
  if (!items || !key) return undefined
  const needle = normalizeLabel(key)
  return items.find((it) => normalizeLabel(it.label || it.chart_name || '') === needle)
}

function findQuickList(
  items: WorkspaceQuickList[] | undefined,
  key: string | undefined,
): WorkspaceQuickList | undefined {
  if (!items || !key) return undefined
  const needle = normalizeLabel(key)
  return items.find((it) => normalizeLabel(it.label || it.document_type || '') === needle)
}

export function WorkspaceContentRenderer({
  workspace,
  details,
}: {
  workspace: Workspace
  details: WorkspaceDetails
}) {
  const blocks = safeParseBlocks(workspace.content)
  if (!blocks || blocks.length === 0) return null

  const shortcutItems = details?.shortcuts?.items || []
  const cardItems = details?.cards?.items || []
  const numberCardItems = details?.number_cards?.items || []
  const chartItems = details?.charts?.items || []
  const quickListItems = details?.quick_lists?.items || []
  const onboardingItems = details?.onboardings?.items || []
  const customBlockItems = details?.custom_blocks?.items || []

  // Precompute label maps for deterministic resolution (Desk does a linear find each time).
  const shortcutByLabel = new Map<string, WorkspaceShortcut>()
  shortcutItems.forEach((s) => shortcutByLabel.set(normalizeLabel(s.label), s))
  const cardByLabel = new Map<string, WorkspaceCard>()
  cardItems.forEach((c) => cardByLabel.set(normalizeLabel(c.label), c))
  const numberCardByLabel = new Map<string, WorkspaceNumberCard>()
  numberCardItems.forEach((c) => numberCardByLabel.set(normalizeLabel(c.label), c))

  return (
    <div className="grid grid-cols-12 gap-4">
      {blocks.map((block, idx) => {
        const key = `${block.type}-${idx}`

        // Default: treat most blocks as 12-col unless overridden by data.col
        const col = block?.data?.col
        const span = colSpanClass(col)

        if (block.type === 'spacer') {
          return <div key={key} className="col-span-12 h-4" />
        }

        if (block.type === 'header') {
          const text = stripHtml(block?.data?.text || '')
          if (!text) return null
          return (
            <div key={key} className="col-span-12 pt-2">
              <h2 className="text-lg font-semibold">{text}</h2>
            </div>
          )
        }

        if (block.type === 'paragraph') {
          const text = stripHtml(block?.data?.text || '')
          if (!text) return null
          return (
            <div key={key} className="col-span-12">
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          )
        }

        if (block.type === 'shortcut') {
          const name = block?.data?.shortcut_name
          const shortcut = name ? shortcutByLabel.get(normalizeLabel(name)) : undefined
          if (!shortcut) return null
          return (
            <div key={key} className={span}>
              <ShortcutCard shortcut={shortcut} workspaceModule={workspace.module} />
            </div>
          )
        }

        if (block.type === 'card') {
          const name = block?.data?.card_name
          const card = name ? cardByLabel.get(normalizeLabel(name)) : undefined
          if (!card) return null
          return (
            <div key={key} className={span}>
              <LinkCard card={card} workspaceModule={workspace.module} />
            </div>
          )
        }

        if (block.type === 'number_card') {
          const name = block?.data?.number_card_name
          const numberCard = name ? numberCardByLabel.get(normalizeLabel(name)) : undefined
          if (!numberCard) return null
          return (
            <div key={key} className={span}>
              <NumberCardItem card={numberCard} />
            </div>
          )
        }

        if (block.type === 'chart') {
          const chart = findChart(chartItems, block?.data?.chart_name)
          if (!chart) return null
          // Full chart rendering requires chart dataset endpoints and chart library parity.
          // For now, we render the chart label in a consistent widget container.
          return (
            <div key={key} className={span}>
              <Card className="p-4">
                <div className="text-sm font-medium">{chart.label || chart.chart_name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Charts are configured in ERPNext and will be rendered here once chart data endpoints are wired.
                </div>
              </Card>
            </div>
          )
        }

        if (block.type === 'quick_list') {
          const quickList = findQuickList(quickListItems, block?.data?.quick_list_name)
          if (!quickList) return null
          return (
            <div key={key} className={span}>
              <Card className="p-4">
                <div className="text-sm font-medium">{quickList.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{quickList.document_type}</div>
              </Card>
            </div>
          )
        }

        if (block.type === 'onboarding') {
          const onboarding = findByLabel(onboardingItems, block?.data?.onboarding_name)
          if (!onboarding) return null
          return (
            <div key={key} className={span}>
              <Card className="p-4">
                <div className="text-sm font-medium">{onboarding.title || onboarding.label}</div>
                {onboarding.subtitle && (
                  <div className="text-xs text-muted-foreground mt-1">{onboarding.subtitle}</div>
                )}
              </Card>
            </div>
          )
        }

        if (block.type === 'custom_block') {
          const customBlock = findByLabel(customBlockItems, block?.data?.custom_block_name)
          if (!customBlock) return null
          return (
            <div key={key} className={span}>
              <Card className="p-4">
                <div className="text-sm font-medium">{customBlock.label || block?.data?.custom_block_name}</div>
              </Card>
            </div>
          )
        }

        // Unknown / unsupported block types are ignored (Desk is tolerant too)
        return null
      })}
    </div>
  )
}





