"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import clsx from "clsx"

export interface SkeletonLoaderProps {
  /** Number of skeleton items to display */
  count?: number
  /** Type of skeleton (card, line, paragraph, avatar, etc.) */
  type?: "card" | "line" | "paragraph" | "avatar" | "button"
  /** Custom className for container */
  className?: string
  /** Whether to show animation */
  animated?: boolean
}

/**
 * SkeletonLoader Component
 * Shimmer loading state for various UI elements
 */
export function SkeletonLoader({
  count = 3,
  type = "card",
  className,
  animated = true,
}: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  if (type === "card") {
    return (
      <div className={clsx("grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3", className)}>
        {items.map((i) => (
          <Card key={i} className="p-6 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-32" />
          </Card>
        ))}
      </div>
    )
  }

  if (type === "line") {
    return (
      <div className={clsx("space-y-3", className)}>
        {items.map((i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    )
  }

  if (type === "paragraph") {
    return (
      <div className={clsx("space-y-3", className)}>
        {items.map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ))}
      </div>
    )
  }

  if (type === "avatar") {
    return (
      <div className={clsx("flex items-center gap-3", className)}>
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    )
  }

  if (type === "button") {
    return (
      <div className={clsx("flex gap-2", className)}>
        {items.map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-md" />
        ))}
      </div>
    )
  }

  return null
}

/**
 * CardSkeleton Component
 * Animated skeleton for card layouts
 */
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return <SkeletonLoader count={count} type="card" />
}

/**
 * TextSkeleton Component
 * Animated skeleton for text content
 */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return <SkeletonLoader count={lines} type="line" />
}
