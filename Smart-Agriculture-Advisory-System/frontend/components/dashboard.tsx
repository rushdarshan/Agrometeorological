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
  AlertCircle,
  Zap,
  Battery
} from "lucide-react"
import { useDashboardStats, useFarms } from "@/lib/api-client"
import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card"
import { SkeletonLoader } from "@/components/shared/skeleton-loader"
import { DISTRICTS } from "@/lib/constants"
import { useState, useEffect } from "react"

interface DashboardProps {
  onNavigateToFarm: (farmId?: number) => void
  onAddFarmer?: () => void
  onViewAllTasks?: () => void
  onViewAllFields?: () => void
  userDistrict?: string
  userName?: string
}

const fieldColors = ["from-amber-400 to-amber-200", "from-green-400 to-green-200", "from-emerald-400 to-emerald-200"]

// Empty State Component
function EmptyState({ icon: Icon, title, description, action }: any) {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Icon className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
          <h4 className="font-semibold text-foreground mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          {action && action}
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </CardContent>
    </Card>
  )
}

export function Dashboard({ onNavigateToFarm, onAddFarmer, onViewAllTasks, onViewAllFields, userDistrict, userName }: DashboardProps) {
  const [farmerName, setFarmerName] = useState(userName || "Farmer")
  const [selectedDistrict, setSelectedDistrict] = useState(userDistrict || DISTRICTS[0])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate())

  // React Query hooks
  const { data: stats, isLoading: statsLoading, isError: statsError } = useDashboardStats(selectedDistrict)
  const { data: farms = [], isLoading: farmsLoading, isError: farmsError } = useFarms(selectedDistrict, 6)

  // Load farmer name from props or first farm owner (demo)
  useEffect(() => {
    if (userName) {
      setFarmerName(userName)
    } else if (farms && farms.length > 0) {
      const firstFarmOwner = farms[0]?.farmer_name || "Farmer"
      setFarmerName(firstFarmOwner)
    }
  }, [farms, userName])

  // Sensor data - mock
  const sensorData = {
    online: farms?.length || 0,
    lowBattery: Math.floor((farms?.length || 0) * 0.1),
    offline: Math.floor((farms?.length || 0) * 0.05),
  }

  // Weather from first farm
  const firstFarmWeather = farms?.[0]?.last_weather

  // Harvest data
  const harvestData = {
    total: farms?.reduce((sum: number, f: any) => sum + (f.area_hectares || 0), 0) || 0,
    crops: [...new Set(farms?.map((f: any) => f.crop_name) || [])]
  }

  // Derived tasks
  const tasks = ((farms || []).slice(0, 2).map((f: any, i: number) => ({
    id: f.id,
    title: f.last_advisory?.advisory_type?.replace(/_/g, " ") || (i === 0 ? "Farm Check" : "Monitoring"),
    location: f.farm_name,
    date: `${f.crop_name} • ${f.area_hectares} ha`,
    status: f.last_advisory?.severity === "high" ? "Urgent" : f.last_advisory ? "Advisory" : "Active",
    statusColor: f.last_advisory?.severity === "high"
      ? "bg-destructive text-destructive-foreground"
      : f.last_advisory?.severity === "medium"
      ? "bg-yellow-600 text-white"
      : "bg-primary text-primary-foreground",
  })).concat([{
    id: 999,
    title: "Regional Advisory",
    location: `${selectedDistrict} district`,
    date: `${stats?.active_advisories_count || 0} active advisories`,
    status: "Active",
    statusColor: "bg-primary text-primary-foreground",
  }]))

  const fields = (farms || []).length
    ? (farms || []).slice(0, 3).map((f: any, i: number) => ({
        id: f.id,
        name: f.farm_name,
        type: f.crop_name,
        harvest: f.last_advisory ? `Advisory: ${f.last_advisory.advisory_type.replace(/_/g, " ")}` : `${f.village}`,
        size: `${f.area_hectares} ha`,
        health: 0.7 + (Math.random() * 0.3),
        color: fieldColors[i % 3],
      }))
    : []

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" })

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Hi {farmerName}! 👨‍🌾</h1>
          <p className="text-muted-foreground text-sm mt-1">{selectedDistrict} district • {currentDate.toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
            onClick={onAddFarmer}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Farm
          </Button>
          <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center">
            <span className="text-lg">👨‍🌾</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : statsError ? (
          <div className="md:col-span-4">
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-destructive">Failed to load statistics</h4>
                    <p className="text-sm text-muted-foreground mt-1">Please check your connection and try again.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <StatCard
              label="Total Advisories"
              value={stats?.active_advisories_count || 0}
              color="text-primary"
            />
            <StatCard
              label="High Priority"
              value={Math.ceil((stats?.active_advisories_count || 0) * 0.3)}
              color="text-destructive"
            />
            <StatCard
              label="Medium Priority"
              value={Math.ceil((stats?.active_advisories_count || 0) * 0.4)}
              color="text-yellow-600"
            />
            <StatCard
              label="Low Priority"
              value={Math.ceil((stats?.active_advisories_count || 0) * 0.3)}
              color="text-blue-600"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Sensors */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Sensors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Wifi className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{sensorData.online}</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Battery className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{sensorData.lowBattery}</p>
                  <p className="text-xs text-muted-foreground">Low Battery</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{sensorData.offline}</p>
                  <p className="text-xs text-muted-foreground">Offline</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-lg"
                onClick={() => {
                  // Simple sensor pairing flow for demo
                  alert("Sensor pairing initialized. Select a farm and enter sensor details.")
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Sensor
              </Button>
            </CardContent>
          </Card>

          {/* Harvest */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Sprout className="w-5 h-5" />
                Total Area
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{harvestData.total.toFixed(1)}</p>
                <p className="text-muted-foreground text-sm mt-1">hectares under cultivation</p>
                {harvestData.crops.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {harvestData.crops.map((crop: any) => (
                      <Badge key={crop} variant="secondary">{crop}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column */}
        <div className="space-y-6">
          {/* Weather */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Sun className="w-5 h-5" />
                Weather
              </CardTitle>
            </CardHeader>
            <CardContent>
              {farmsLoading ? (
                <LoadingSkeleton />
              ) : !firstFarmWeather ? (
                <EmptyState
                  icon={CloudRain}
                  title="Weather data unavailable"
                  description="No weather data for your location yet. Check back soon."
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <Sun className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-sm text-muted-foreground">Temp</p>
                      <p className="text-2xl font-bold text-blue-600">{firstFarmWeather.temp_mean?.toFixed(0) || "—"}°C</p>
                    </div>
                    <div className="p-3 bg-cyan-50 rounded-lg text-center">
                      <Droplets className="w-6 h-6 text-cyan-600 mx-auto mb-1" />
                      <p className="text-sm text-muted-foreground">Humidity</p>
                      <p className="text-2xl font-bold text-cyan-600">{firstFarmWeather.humidity?.toFixed(0) || "—"}%</p>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <CloudRain className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                    <p className="text-sm text-muted-foreground">Rainfall</p>
                    <p className="text-2xl font-bold text-purple-600">{firstFarmWeather.rainfall?.toFixed(0) || "0"}mm</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Upcoming Tasks</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewAllTasks && onViewAllTasks()}
              >
                See all →
              </Button>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <EmptyState
                  icon={AlertCircle}
                  title="No tasks scheduled"
                  description="All caught up! New advisories will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 3).map((task: any) => (
                    <div
                      key={task.id}
                      className="p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => task.id !== 999 && onNavigateToFarm(task.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm capitalize">{task.title}</p>
                          <p className="text-xs text-muted-foreground">{task.location}</p>
                          <p className="text-xs text-muted-foreground mt-1">{task.date}</p>
                        </div>
                        <Badge className={task.statusColor} variant="default">
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Fields */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Your Fields</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewAllFields && onViewAllFields()}
              >
                See all →
              </Button>
            </CardHeader>
            <CardContent>
              {farmsLoading ? (
                <LoadingSkeleton />
              ) : fields.length === 0 ? (
                <EmptyState
                  icon={Sprout}
                  title="No fields added yet"
                  description="Add your first farm to get personalized advisories."
                  action={<Button size="sm" onClick={onAddFarmer}>Add Farm</Button>}
                />
              ) : (
                <div className="space-y-3">
                  {fields.map((field: any) => (
                    <div
                      key={field.id}
                      className="p-3 rounded-lg border border-muted hover:bg-accent/50 cursor-pointer transition-all"
                      onClick={() => onNavigateToFarm(field.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${field.color} flex items-center justify-center flex-shrink-0`}>
                          <Sprout className="w-6 h-6 text-white opacity-75" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{field.name}</p>
                          <p className="text-xs text-muted-foreground">{field.type}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{ width: `${field.health * 100}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">{(field.health * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{monthName}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <p key={day} className="font-medium text-muted-foreground">{day}</p>
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => {
                    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
                    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
                    const dayNum = i - firstDay + 1
                    const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth
                    const isToday = isCurrentMonth && dayNum === new Date().getDate() && currentDate.getMonth() === new Date().getMonth()
                    const isSelected = isCurrentMonth && dayNum === selectedDate && currentDate.getMonth() === new Date().getMonth()

                    return (
                      <div
                        key={i}
                        onClick={() => isCurrentMonth && dayNum && setSelectedDate(dayNum)}
                        className={`p-2 rounded text-sm transition-colors ${
                          isToday
                            ? "bg-primary text-primary-foreground font-bold"
                            : isSelected
                            ? "bg-accent text-foreground font-semibold"
                            : isCurrentMonth
                            ? "hover:bg-muted cursor-pointer"
                            : "text-muted-foreground opacity-50"
                        }`}
                      >
                        {isCurrentMonth ? dayNum : ""}
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
