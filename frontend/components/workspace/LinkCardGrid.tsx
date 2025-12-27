'use client'

import { LinkCard } from './LinkCard'
import type { WorkspaceCard } from '@/lib/types/workspace'

interface LinkCardGridProps {
  cards: WorkspaceCard[]
  workspaceModule?: string
}

export function LinkCardGrid({ cards, workspaceModule }: LinkCardGridProps) {
  if (!cards || cards.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Reports & Masters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, idx) => (
          <LinkCard 
            key={`${card.label}-${idx}`} 
            card={card}
            workspaceModule={workspaceModule}
          />
        ))}
      </div>
    </div>
  )
}

