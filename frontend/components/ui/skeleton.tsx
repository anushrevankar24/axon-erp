import * as React from "react"
import { cn } from "@/lib/utils"

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-gray-200",
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-shimmer",
        "before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-3 animate-in fade-in-50 duration-300">
      {/* Tab skeleton */}
      <div className="border-b border-gray-200 pb-2">
        <div className="flex gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Section 1 */}
      <div className="border border-gray-200 rounded-md bg-white">
        <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            {/* Column 1 */}
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
            {/* Column 2 */}
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="border border-gray-200 rounded-md bg-white">
        <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            {/* Column 1 */}
            <div className="space-y-2.5">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
            {/* Column 2 */}
            <div className="space-y-2.5">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 */}
      <div className="border border-gray-200 rounded-md bg-white">
        <div className="p-4 space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 10, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="border border-gray-200 rounded-md bg-white animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex items-center px-4 py-3 gap-4">
          <Skeleton className="h-4 w-4" />
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center px-4 py-3 gap-4">
            <Skeleton className="h-4 w-4" />
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-in fade-in-50 duration-300">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border border-gray-200 rounded-md bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-96" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

