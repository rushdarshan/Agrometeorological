"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Cloud,
  Wind,
  Droplets,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { useFarmTimeline, useFarmWeather } from "@/lib/api-client"
import { SkeletonLoader } from "@/components/shared/skeleton-loader"
import { CROPS } from "@/lib/constants"
import type { Farm, Advisory } from "@/lib/types"

interface MyFarmProps {
  onBack: () => void
  farmId?: number
}

export function MyFarm({ onBack, farmId }: MyFarmProps) {
  // Use React Query hooks
  const { data: timeline = null, isLoading: timelineLoading, isError: timelineError } = useFarmTimeline(farmId ?? 0, 30)
  const { data: weatherData = {}, isLoading: weatherLoading, isError: weatherError } = useFarmWeather(farmId ?? 0)

  // Form state for editable fields
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [formData, setFormData] = useState<Partial<Farm>>({
    farm_name: timeline?.farm_name || "",
    crop_name: timeline?.crop_name || "Rice",
    area_hectares: timeline?.farm_name ? 5 : 0,
    village: timeline?.farm_name ? "Village" : "",
  })

  // Fallback if no farmId and still loading
  if (!farmId && !timelineLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No farm selected. Please select a farm from the dashboard.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const weather = (weatherData as any)?.daily?.[0] || (weatherData as any)?.summary
  const advisories = (timeline as any)?.advisories || []

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulate API call - in production, use useUpdateFarm mutation
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSaveMessage({ type: "success", text: "Farm information updated successfully!" })
      setIsEditMode(false)
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage({ type: "error", text: "Failed to save farm information. Please try again." })
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  if (timelineError || weatherError) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load farm data. Please try again later.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {timelineLoading ? <div className="h-8 w-48 bg-secondary rounded animate-pulse" /> : <h1 className="text-3xl font-bold text-foreground">{(timeline as any)?.farm_name || "Farm Details"}</h1>}
        </div>
        <Button
          onClick={() => setIsEditMode(!isEditMode)}
          variant={isEditMode ? "destructive" : "default"}
          className="rounded-full"
        >
          {isEditMode ? "Cancel" : "Edit"}
        </Button>
      </div>

      {saveMessage && (
        <Alert variant={saveMessage.type === "success" ? "default" : "destructive"} className="mb-6">
          <div className="flex items-center gap-2">
            {saveMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{saveMessage.text}</AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Farm Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Farm Details Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Farm Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {timelineLoading ? (
                <SkeletonLoader type="line" count={4} />
              ) : (
                <>
                  {/* Farm Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Farm Name</label>
                    {isEditMode ? (
                      <Input
                        value={formData.farm_name || ""}
                        onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                        placeholder="Enter farm name"
                        className="rounded-lg"
                      />
                    ) : (
                      <p className="text-foreground">{formData.farm_name || "—"}</p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </label>
                    {isEditMode ? (
                      <Input
                        value={formData.village || ""}
                        onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                        placeholder="Village name"
                        className="rounded-lg"
                      />
                    ) : (
                      <p className="text-muted-foreground">{formData.village || "—"}</p>
                    )}
                  </div>

                  {/* Crop Type */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Crop Type</label>
                    {isEditMode ? (
                      <Select value={formData.crop_name || "Rice"} onValueChange={(value) => setFormData({ ...formData, crop_name: value })}>
                        <SelectTrigger className="rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CROPS.map((crop) => (
                            <SelectItem key={crop} value={crop}>
                              {crop}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-foreground">{formData.crop_name || "—"}</p>
                    )}
                  </div>

                  {/* Farm Size */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Farm Size (hectares)</label>
                    {isEditMode ? (
                      <Input
                        type="number"
                        value={formData.area_hectares || ""}
                        onChange={(e) => setFormData({ ...formData, area_hectares: parseFloat(e.target.value) || 0 })}
                        placeholder="Enter area in hectares"
                        step="0.1"
                        min="0.1"
                        className="rounded-lg"
                      />
                    ) : (
                      <p className="text-foreground">{formData.area_hectares || "—"} ha</p>
                    )}
                  </div>

                  {isEditMode && (
                    <Button onClick={handleSave} disabled={isSaving} className="w-full rounded-lg">
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Advisories Section */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Advisories</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <SkeletonLoader type="card" count={3} />
              ) : advisories.length > 0 ? (
                <div className="space-y-3">
                  {advisories.slice(0, 5).map((advisory: any) => (
                    <div key={advisory.id} className="flex items-start justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-foreground capitalize">
                            {(advisory.advisory_type || advisory.type || "Advisory")
                              .toString()
                              .replace(/_/g, " ")
                              .toLowerCase()}
                          </h4>
                          <Badge
                            variant={advisory.severity === "high" ? "destructive" : advisory.severity === "medium" ? "secondary" : "default"}
                            className="rounded-full"
                          >
                            {advisory.severity || "medium"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{advisory.message}</p>
                        <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
                          {new Date(advisory.generated_at || "").toLocaleDateString('en-US')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No advisories yet for this farm.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Weather & Stats */}
        <div className="space-y-6">
          {/* Current Weather */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                Weather
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weatherLoading ? (
                <SkeletonLoader type="paragraph" count={4} />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Temperature</span>
                    <span className="text-2xl font-bold">{weather?.temp_mean || "—"}°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Droplets className="w-4 h-4" />
                      <span>Humidity</span>
                    </div>
                    <span className="text-lg font-semibold">{weather?.humidity || "—"}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wind className="w-4 h-4" />
                      <span>Wind Speed</span>
                    </div>
                    <span className="text-lg font-semibold">{weather?.wind_speed || "—"} km/h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rainfall</span>
                    <span className="text-lg font-semibold">{weather?.rainfall || "0"} mm</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Farm Stats */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Farm Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {timelineLoading ? (
                <SkeletonLoader type="line" count={3} />
              ) : (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Total Advisories</span>
                    <span className="font-bold text-lg">{advisories.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">High Priority</span>
                    <span className="font-bold text-lg text-destructive">
                      {advisories.filter((a: Advisory) => a.severity === "high").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Avg Confidence</span>
                    <span className="font-bold text-lg">
                      {advisories.length > 0
                        ? Math.round(
                            (advisories.reduce((sum: number, a: Advisory) => sum + a.confidence, 0) / advisories.length) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
