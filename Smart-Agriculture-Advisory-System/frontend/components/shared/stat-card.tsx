"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import clsx from "clsx"

export interface StatCardProps {
  title: string
  value: string | number | ReactNode
  icon?: ReactNode
  description?: string
  footer?: string
  isLoading?: boolean
  error?: string | null
  className?: string
  variant?: "default" | "accent" | "destructive"
  trend?: {
    value: number
    direction: "up" | "down"
    label: string
  }
  onClick?: () => void
  actionLabel?: string
}

const variantStyles = {
  default: "border-0 shadow-sm hover:shadow-md",
  accent: "border border-primary/20 bg-primary/5",
  destructive: "border border-destructive/20 bg-destructive/5",
}

const titleVariantStyles = {
  default: "text-muted-foreground",
  accent: "text-primary",
  destructive: "text-destructive",
}

/**
 * StatCard Component
 * Reusable metric display card with loading and error states
 */
export function StatCard({
  title,
  value,
  icon,
  description,
  footer,
  isLoading = false,
  error = null,
  className,
  variant = "default",
  trend,
  onClick,
  actionLabel,
}: StatCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && onClick) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <button
      {...(onClick ? { role: "button" } : { disabled: true })}
      type="button"
      className={clsx(
        "text-left rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all duration-200",
        variantStyles[variant],
        onClick && "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:shadow-lg hover:scale-105 active:scale-95",
        !onClick && "cursor-default"
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className={clsx("text-sm md:text-base font-semibold tracking-tight", titleVariantStyles[variant])}>
            {title}
          </h3>
          {icon && <div className="text-muted-foreground flex-shrink-0">{icon}</div>}
        </div>

        <div className="space-y-3">
          {/* Value - use fixed height to prevent layout shift */}
          <div className="h-10 md:h-12">
            {isLoading ? (
              <Skeleton className="h-full w-32 rounded-md" />
            ) : error ? (
              <p className="text-sm text-destructive">Error loading data</p>
            ) : (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl md:text-4xl font-bold text-foreground leading-none">{value}</span>
                {trend && (
                  <span
                    className={clsx(
                      "text-xs font-semibold px-2.5 py-1.5 rounded-md whitespace-nowrap",
                      trend.direction === "up"
                        ? "text-white bg-green-500"
                        : "text-white bg-red-500"
                    )}
                    aria-label={`${trend.direction === "up" ? "Increase" : "Decrease"} ${trend.value}% ${trend.label}`}
                  >
                    {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {description && !isLoading && !error && (
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          )}

          {/* Footer */}
          {footer && !isLoading && !error && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">{footer}</span>
              {actionLabel && (
                <span className="text-xs font-semibold text-primary">
                  {actionLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

/**
 * StatCardSkeleton Component
 * Loading skeleton for StatCard
 */
export function StatCardSkeleton({ title = "Loading..." }: { title?: string }) {
  return <StatCard title={title} isLoading={true} value={<Skeleton className="h-8 w-32" />} />
}
