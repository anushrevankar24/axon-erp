import { WorkspaceSidebar } from '@/components/layout/WorkspaceSidebar'
import { UnifiedHeader } from '@/components/layout/UnifiedHeader'
import { WorkspaceErrorBoundary } from '@/components/workspace/ErrorBoundary'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden flex-col">
      <UnifiedHeader />
      <div className="flex flex-1 overflow-hidden">
        <WorkspaceSidebar />
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <WorkspaceErrorBoundary>
            {children}
          </WorkspaceErrorBoundary>
        </main>
      </div>
    </div>
  )
}

