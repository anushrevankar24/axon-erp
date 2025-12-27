'use client'

import { ShortcutCard } from './ShortcutCard'
import type { WorkspaceShortcut } from '@/lib/types/workspace'

interface ShortcutGridProps {
  shortcuts: WorkspaceShortcut[]
  workspaceModule?: string
}

export function ShortcutGrid({ shortcuts, workspaceModule }: ShortcutGridProps) {
  if (!shortcuts || shortcuts.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Your Shortcuts</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {shortcuts.map((shortcut, idx) => (
          <ShortcutCard 
            key={`${shortcut.label}-${idx}`} 
            shortcut={shortcut}
            workspaceModule={workspaceModule}
          />
        ))}
      </div>
    </div>
  )
}

