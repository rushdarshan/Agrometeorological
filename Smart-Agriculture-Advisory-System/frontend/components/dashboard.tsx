"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Wind, 
  Droplets, 
  CloudRain,
  Wifi,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sun,
  Sprout,
  AlertCircle
} from "lucide-react"
import { useDashboardStats, useFarms } from "@/lib/api-client"
import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card"
import { SkeletonLoader } from "@/components/shared/skeleton-loader"
import { DISTRICTS } from "@/lib/constants"

interface DashboardProps {
  onNavigateToFarm: (farmId?: number) => void
  onAddFarmer?: () => void
}

const fieldColors = ["from-amber-400 to-amber-200", "from-green-400 to-green-200", "from-emerald-400 to-emerald-200"]

// Error Boundary Component
function ErrorFallback({ message }: { message: string }) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-destructive">Data unavailable</h4>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function Dashboard({ onNavigateToFarm, onAddFarmer }: DashboardProps) {
  const district = DISTRICTS[0] // Default to first district (Kaira)
  
  // React Query hooks - replace manual state + useEffect
  const { data: stats = {} as any, isLoading: statsLoading, isError: statsError } = useDashboardStats(district)
  const { data: farms = [], isLoading: farmsLoading, isError: farmsError } = useFarms(district, 6)

  // Derived data - computed from React Query results
  const sensorData = {
    online: (stats as any)?.total_farms ?? 0,
    lowBattery: 0,
    offline: 0,
  }

  const weatherData = (farms as any)?.[0]?.last_weather
  
  const harvestData = (stats as any)?.harvest_data ?? {
    total: 0,
    crops: []
  }

  const tasks = ((farms as any) || []).slice(0, 2).map((f: any, i: number) => ({
    id: f.id,
    title: f.last_advisory?.advisory_type ?? (i === 0 ? "Farm Check" : "Monitoring"),
    location: f.farm_name,
    date: `${f.crop_name} · ${f.area_hectares} ha`,
    status: f.last_advisory?.severity === "high" ? "Urgent" : f.last_advisory ? "Advisory" : "Active",
    statusColor: f.last_advisory?.severity === "high"
      ? "bg-destructive text-destructive-foreground"
      : "bg-primary text-primary-foreground",
  })).concat([{
    id: 999,
    title: "Regional Advisory",
    location: `${district} district`,
    date: `${(stats as any)?.active_advisories_count ?? 0} active advisories`,
    status: "Active",
    statusColor: "bg-primary text-primary-foreground",
  }])

  const fields = ((farms as any) || []).length
    ? ((farms as any) || []).slice(0, 3).map((f: any, i: number) => ({
        id: f.id,
        name: f.farm_name,
        type: f.crop_name,
        harvest: f.last_advisory ? `Advisory: ${f.last_advisory.advisory_type}` : `${f.village}`,
        size: `${f.area_hectares} ha`,
        health: Math.random() * 0.5 + 0.1,
        color: fieldColors[i % 3],
      }))
    : []

  const today = new Date()
  const monthName = today.toLocaleString("default", { month: "long", year: "numeric" })

  // Show loading or error states
  const hasError = statsError || farmsError
  const isLoading = statsLoading || farmsLoading

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hi Farmer!</h1>
          {hasError && (
            <p className="text-xs text-destructive mt-1">
              ⚠ Some data unavailable — retrying automatically
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6" onClick={() => onAddFarmer?.()}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
          <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center">
            <span className="text-lg">👨‍🌾</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Indicators Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Indicators</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {/* Sensors */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Sensors</span>
                  <Wifi className="w-4 h-4" />
                </div>
                {isLoading ? (
                  <SkeletonLoader type="paragraph" count={3} />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-foreground">{sensorData.online}</span>
                      <span className="text-xs text-muted-foreground">Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-semibold text-foreground">{sensorData.lowBattery}</span>
                      <span className="text-xs text-muted-foreground">Low battery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-semibold text-foreground">{sensorData.offline}</span>
                      <span className="text-xs text-muted-foreground">Offline</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Weather */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Weather</span>
                  <Sun className="w-4 h-4 text-accent" />
                </div>
                {isLoading ? (
                  <SkeletonLoader type="paragraph" count={4} />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        {weatherData?.temp_mean ?? "—"}
                      </span>
                      <span className="text-lg text-muted-foreground">°C</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Wind className="w-3 h-3" />
                      <span>{weatherData?.wind_speed ?? "—"} km/h</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Droplets className="w-3 h-3" />
                      <span>{weatherData?.humidity ?? "—"}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CloudRain className="w-3 h-3" />
                      <span>{weatherData?.rainfall ?? "—"} mm</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Harvest Card - Using StatCard Component */}
          {isLoading ? (
            <StatCardSkeleton />
          ) : statsError ? (
            <ErrorFallback message="Unable to load harvest data" />
          ) : (
            <StatCard
              title="Harvest"
              value={harvestData.total.toFixed(1)}
              description="tonnes harvested"
              variant="default"
            />
          )}
        </div>

        {/* Middle Column - Tasks */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upcoming Tasks */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Upcoming tasks</CardTitle>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                See all
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-20 bg-secondary/30 rounded-xl animate-pulse" />
                ))
              ) : (
                tasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Sprout className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">{task.location}</p>
                        <p className="text-xs text-muted-foreground">{task.date}</p>
                      </div>
                    </div>
                    <Badge className={`${task.statusColor} rounded-full px-3`}>
                      {task.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Fields */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Fields</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  See all
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <div className="aspect-square bg-secondary rounded-2xl animate-pulse" />
                      <SkeletonLoader type="line" count={2} />
                    </div>
                  ))
                ) : fields.length > 0 ? (
                  fields.map((field) => (
                    <button 
                      key={field.id}
                      onClick={() => onNavigateToFarm(field.id)}
                      className="text-left group"
                    >
                      <div className="aspect-square rounded-2xl bg-gradient-to-br from-green-100 to-green-50 p-4 relative overflow-hidden mb-3 group-hover:shadow-md transition-shadow">
                        <div className="absolute top-3 left-3 text-xs text-muted-foreground bg-card/80 backdrop-blur px-2 py-1 rounded-md">
                          ↗ {field.health.toFixed(2)}
                        </div>
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <polygon 
                            points="20,30 80,25 85,75 15,80"
                            fill={field.id % 2 === 1 ? "#fbbf24" : "#4ade80"}
                            fillOpacity={0.6}
                            stroke={field.id % 2 === 1 ? "#f59e0b" : "#22c55e"}
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-foreground text-sm">{field.name}</h4>
                          <p className="text-xs text-muted-foreground">{field.harvest}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-foreground">{field.type}</p>
                          <p className="text-xs text-muted-foreground">{field.size}</p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <ErrorFallback message="No fields to display" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Calendar */}
        <div className="lg:col-span-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">{monthName}</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <div key={i} className="text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                {(() => {
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
                  const startOffset = firstDay === 0 ? 6 : firstDay - 1
                  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
                  const cells = [...Array(startOffset).fill(0), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
                  while (cells.length % 7 !== 0) cells.push(0)
                  return cells.map((date, i) => {
                    const isToday = date === today.getDate()
                    return (
                      <div key={i} className={`
                        aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer transition-colors
                        ${!date ? "text-transparent" : ""}
                        ${isToday ? "bg-primary text-primary-foreground font-semibold" : date ? "hover:bg-secondary" : ""}
                      `}>
                        {date || ""}
                      </div>
                    )
                  })
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
