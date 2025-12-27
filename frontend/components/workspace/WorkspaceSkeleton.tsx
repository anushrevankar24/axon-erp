import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function WorkspaceSkeleton() {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-40" />
      </div>

      {/* Number Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-20" />
          </Card>
        ))}
      </div>

      {/* Shortcuts */}
      <div>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 h-28" />
          ))}
        </div>
      </div>

      {/* Link Cards */}
      <div>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 h-64" />
          ))}
        </div>
      </div>
    </div>
  )
}

