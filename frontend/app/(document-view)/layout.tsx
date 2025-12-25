import { UnifiedHeader } from '@/components/layout/UnifiedHeader'

export default function DocumentViewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      {/* Unified Header - consistent across all pages */}
      <UnifiedHeader />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}

