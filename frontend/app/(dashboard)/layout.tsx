import { UnifiedHeader } from '@/components/layout/UnifiedHeader'
import { WorkspaceErrorBoundary } from '@/components/workspace/ErrorBoundary'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Important: prevent <body> scrolling so sidebar doesn't scroll with page.
    // Pages (workspace, list, form) manage their own scroll regions.
    <div className="h-screen flex flex-col overflow-hidden">
      <UnifiedHeader />
      {/* Main content - fixed viewport region, children own scroll */}
      <main className="flex-1 flex min-h-0 overflow-hidden">
        <WorkspaceErrorBoundary>
          {children}
        </WorkspaceErrorBoundary>
      </main>
    </div>
  )
}

