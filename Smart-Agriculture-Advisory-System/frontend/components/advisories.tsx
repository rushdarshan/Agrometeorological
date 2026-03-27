"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertCircle,
  ChevronRight,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Filter,
  Loader2,
} from "lucide-react"
import { useAdvisories } from "@/lib/api-client"
import { SkeletonLoader } from "@/components/shared/skeleton-loader"
import { ADVISORY_TYPES, SEVERITY_LEVELS, CROPS } from "@/lib/constants"
import type { Advisory, AdvisoryFilters } from "@/lib/types"

export function Advisories() {
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<AdvisoryFilters>({
    sortBy: "newest",
  })
  const [selectedAdvisory, setSelectedAdvisory] = useState<Advisory | null>(null)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState("")

  const pageSize = 10
  const { data: advisories = [], isLoading, isError } = useAdvisories(pageSize, page * pageSize)

  // Filter and sort advisories
  const filteredAdvisories = useMemo(() => {
    if (!advisories || !Array.isArray(advisories)) return []

    let filtered = [...advisories]

    // Apply filters
    if (filters.severity) {
      filtered = filtered.filter((a) => a.severity === filters.severity)
    }

    // Sort
    if (filters.sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.generated_at || "").getTime() - new Date(a.generated_at || "").getTime())
    } else if (filters.sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.generated_at || "").getTime() - new Date(b.generated_at || "").getTime())
    } else if (filters.sortBy === "severity") {
      const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
      filtered.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3))
    }

    return filtered
  }, [advisories, filters])

  const handleFeedback = async (helpful: boolean) => {
    try {
      // In production, use useFeedback mutation
      await new Promise((resolve) => setTimeout(resolve, 500))
      setShowFeedbackForm(false)
      setFeedbackMessage("")
      setSelectedAdvisory(null)
      // Show success message
    } catch (error) {
      console.error("Failed to submit feedback:", error)
    }
  }

  const totalPages = Math.ceil((Array.isArray(advisories) ? advisories.length : 0) / pageSize)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">Advisories</h1>
        <div className="flex items-center gap-3">
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
            onClick={() => alert("Report download started. Check your downloads folder.")}
            aria-label="Download advisory report as PDF"
          >
            <Plus className="w-4 h-4 mr-2" />
            Download Report (PDF)
          </Button>
          <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center" aria-hidden="true">
            <span className="text-lg">👨‍🌾</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Advisories", value: (advisories as any[])?.length || 0, color: "text-primary" },
          {
            label: "High Priority",
            value: (advisories as any[])?.filter((a: Advisory) => a.severity === "high").length || 0,
            color: "text-destructive",
          },
          {
            label: "Medium Priority",
            value: (advisories as any[])?.filter((a: Advisory) => a.severity === "medium").length || 0,
            color: "text-amber-600",
          },
          {
            label: "Low Priority",
            value: (advisories as any[])?.filter((a: Advisory) => a.severity === "low").length || 0,
            color: "text-blue-600",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
              <p className={`text-4xl font-bold ${stat.color}`}>{isLoading ? "…" : stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Severity</label>
              <Select
                value={filters.severity || ""}
                onValueChange={(value) => setFilters({ ...filters, severity: (value as any) || undefined })}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Sort By</label>
              <Select
                value={filters.sortBy || "newest"}
                onValueChange={(value) => setFilters({ ...filters, sortBy: (value as any) })}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="severity">By Severity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full rounded-lg"
                onClick={() => setFilters({ sortBy: "newest" })}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advisories List */}
      {isError ? (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load advisories. Please try again later.</AlertDescription>
        </Alert>
      ) : isLoading ? (
        <SkeletonLoader type="card" count={5} />
      ) : filteredAdvisories.length > 0 ? (
        <div className="space-y-4 mb-8">
          {filteredAdvisories.map((advisory) => (
            <Card
              key={advisory.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedAdvisory(advisory)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-foreground text-lg capitalize">
                        {advisory.advisory_type.replace(/_/g, " ")}
                      </h3>
                      <Badge
                        variant={
                          advisory.severity === "high"
                            ? "destructive"
                            : advisory.severity === "medium"
                              ? "secondary"
                              : "default"
                        }
                        className="rounded-full"
                      >
                        {advisory.severity}
                      </Badge>
                      <Badge variant="outline" className="rounded-full text-xs">
                        {((advisory.confidence || 0) * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">{advisory.message}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span suppressHydrationWarning>{new Date(advisory.generated_at || "").toLocaleDateString('en-US')}</span>
                      </div>
                      {advisory.generated_by && (
                        <span className="text-xs bg-muted px-2 py-1 rounded-md">{advisory.generated_by}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground mb-4">No advisories found matching your filters.</p>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setFilters({ sortBy: "newest" })}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage(Math.max(0, page - 1))}
            className="rounded-full"
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            className="rounded-full"
          >
            Next
          </Button>
        </div>
      )}

      {/* Advisory Detail Modal */}
      {selectedAdvisory && (
        <Dialog open={!!selectedAdvisory} onOpenChange={() => setSelectedAdvisory(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="capitalize">{selectedAdvisory.advisory_type?.replace(/_/g, " ") || "Advisory"}</DialogTitle>
              <DialogDescription>Advisory Details & Recommendations</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Advisory Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Severity</label>
                  <Badge
                    variant={
                      selectedAdvisory.severity === "high"
                        ? "destructive"
                        : selectedAdvisory.severity === "medium"
                          ? "secondary"
                          : "default"
                    }
                    className="w-fit"
                  >
                    {selectedAdvisory.severity}
                  </Badge>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Recommendation</label>
                  <p className="text-foreground leading-relaxed">{selectedAdvisory.message}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Date Generated</label>
                  <p className="text-muted-foreground" suppressHydrationWarning>
                    {new Date(selectedAdvisory.generated_at || "").toLocaleString('en-US')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Confidence Score</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${(selectedAdvisory.confidence || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {Math.round((selectedAdvisory.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>

                {/* SHAP Explanation placeholder */}
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>How we calculated this:</strong> This advisory was generated based on current weather conditions, crop stage, and
                    historical patterns for {selectedAdvisory.advisory_type?.replace(/_/g, " ") || "this advisory"} in your region.
                  </p>
                </div>
              </div>

              {/* Feedback Section */}
              <div className="border-t border-border pt-6">
                <h4 className="font-medium text-foreground mb-4">Was this advisory helpful?</h4>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-lg"
                    onClick={() => {
                      setShowFeedbackForm(true)
                    }}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Helpful
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-lg"
                    onClick={() => {
                      setShowFeedbackForm(true)
                    }}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Not Helpful
                  </Button>
                </div>

                {showFeedbackForm && (
                  <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Additional Comments (Optional)
                    </label>
                    <Input
                      placeholder="Share your feedback..."
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      className="rounded-lg mb-3"
                    />
                    <Button
                      onClick={() => handleFeedback(true)}
                      className="w-full rounded-lg"
                    >
                      Submit Feedback
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
