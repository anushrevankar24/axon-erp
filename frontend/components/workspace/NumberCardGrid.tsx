'use client'

import { NumberCardItem } from './NumberCardItem'
import type { WorkspaceNumberCard } from '@/lib/types/workspace'

interface NumberCardGridProps {
  cards: WorkspaceNumberCard[]
}

export function NumberCardGrid({ cards }: NumberCardGridProps) {
  if (!cards || cards.length === 0) return null

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <NumberCardItem key={`${card.label}-${idx}`} card={card} />
        ))}
      </div>
    </div>
  )
}

