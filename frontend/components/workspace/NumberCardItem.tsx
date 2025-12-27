'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import type { WorkspaceNumberCard } from '@/lib/types/workspace'

interface NumberCardItemProps {
  card: WorkspaceNumberCard
}

export function NumberCardItem({ card }: NumberCardItemProps) {
  // TODO: Fetch actual number from Number Card API
  // For now, show placeholder
  
  return (
    <Card className="p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="p-2 rounded-lg bg-primary/10">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
      </div>
    </Card>
  )
}

