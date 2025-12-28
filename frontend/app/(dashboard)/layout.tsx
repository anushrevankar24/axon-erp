import { UnifiedHeader } from '@/components/layout/UnifiedHeader'
import { WorkspaceErrorBoundary } from '@/components/workspace/ErrorBoundary'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <UnifiedHeader />
      {/* Main content - body handles scrolling, no nested overflow */}
      <main className="flex-1 flex">
        <WorkspaceErrorBoundary>
          {children}
        </WorkspaceErrorBoundary>
      </main>
    </div>
  )
}

