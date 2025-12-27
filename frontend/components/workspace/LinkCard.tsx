'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LinkItem } from './LinkItem'
import { getWorkspaceIcon } from '@/lib/utils/icons'
import type { WorkspaceCard } from '@/lib/types/workspace'

interface LinkCardProps {
  card: WorkspaceCard
  workspaceModule?: string
}

export function LinkCard({ card, workspaceModule }: LinkCardProps) {
  const Icon = getWorkspaceIcon(card.icon || '')

  // Filter out hidden links
  const visibleLinks = card.links.filter(link => !link.hidden)
  
  if (visibleLinks.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          {card.icon && <Icon className="w-5 h-5 text-primary" />}
          {card.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {visibleLinks.map((link, idx) => (
          <LinkItem 
            key={`${link.label}-${idx}`} 
            link={link}
            workspaceModule={workspaceModule}
          />
        ))}
      </CardContent>
    </Card>
  )
}

