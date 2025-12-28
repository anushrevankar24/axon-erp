import { UnifiedHeader } from '@/components/layout/UnifiedHeader'

export default function DocumentViewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Unified Header - sticky at top */}
      <UnifiedHeader />
      {/* Main content - no nested scroll, body handles scrolling */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}

