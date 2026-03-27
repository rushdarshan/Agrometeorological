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
  return (
    <Card
      className={clsx(
        "transition-all",
        variantStyles[variant],
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className={clsx("text-sm font-medium", titleVariantStyles[variant])}>
            {title}
          </CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Value */}
        <div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 rounded-md" />
          ) : error ? (
            <p className="text-sm text-destructive">Error loading data</p>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{value}</span>
              {trend && (
                <span
                  className={clsx(
                    "text-xs font-medium px-2 py-1 rounded",
                    trend.direction === "up"
                      ? "text-green-700 bg-green-100"
                      : "text-red-700 bg-red-100"
                  )}
                >
                  {trend.direction === "up" ? "↑" : "↓"} {trend.value}% {trend.label}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {description && !isLoading && !error && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}

        {/* Footer */}
        {footer && !isLoading && !error && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">{footer}</span>
            {actionLabel && (
              <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                {actionLabel}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * StatCardSkeleton Component
 * Loading skeleton for StatCard
 */
export function StatCardSkeleton({ title = "Loading..." }: { title?: string }) {
  return <StatCard title={title} isLoading={true} value={<Skeleton className="h-8 w-32" />} />
}
