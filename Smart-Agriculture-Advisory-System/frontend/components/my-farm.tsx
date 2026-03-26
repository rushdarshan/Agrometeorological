"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  ChevronDown, 
  Cloud, 
  Wind, 
  Droplets,
  Plus,
  Minus,
  Maximize2,
  Navigation,
  Droplet,
  AlertTriangle
} from "lucide-react"

import { useEffect, useState } from "react"
import { getFarmTimeline, getFarmWeather, getFarms, type FarmTimeline, type WeatherForecast, type FarmSummary } from "@/lib/api"

interface MyFarmProps {
  onBack: () => void
  farmId?: number
}

const CROP_COLORS = ["bg-amber-400", "bg-primary", "bg-green-300", "bg-blue-400", "bg-purple-400"]

export function MyFarm({ onBack, farmId }: MyFarmProps) {
  const [timeline, setTimeline] = useState<FarmTimeline | null>(null)
  const [weather, setWeather] = useState<WeatherForecast[]>([])
  const [allFarms, setAllFarms] = useState<FarmSummary[]>([])
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(farmId)

  useEffect(() => {
    getFarms("Kaira", 20).then(setAllFarms).catch(() => {})
  }, [])

  useEffect(() => {
    const id = selectedFarmId ?? farmId
    if (!id) return
    getFarmTimeline(id).then(setTimeline).catch(() => {})
    getFarmWeather(id).then(r => setWeather(r.daily ?? [])).catch(() => {})
  }, [selectedFarmId, farmId])

  const latestWeather = weather[0] ?? timeline?.weather?.[0]
  const todayAdvisories = timeline?.advisories.slice(0, 3) ?? []
  const farmName = timeline?.farm_name ?? "My Farm"
  const cropName = timeline?.crop_name ?? "Rice"
  const today = new Date()

  // Build crop distribution from farms list
  const cropMap: Record<string, number> = {}
  allFarms.forEach(f => { cropMap[f.crop_name] = (cropMap[f.crop_name] ?? 0) + f.area_hectares })
  const totalHa = Object.values(cropMap).reduce((s, v) => s + v, 0) || 45
  const cropDistribution = {
    total: Math.round(totalHa),
    crops: Object.entries(cropMap).slice(0, 4).map(([name, ha], i) => ({
      name, hectares: ha, percentage: Math.round((ha / totalHa) * 1000) / 10, color: CROP_COLORS[i % CROP_COLORS.length]
    }))
  }
  if (!cropDistribution.crops.length) cropDistribution.crops = [
    { name: "Rice", percentage: 39.5, hectares: 14.5, color: "bg-amber-400" },
    { name: "Wheat", percentage: 32.3, hectares: 13.5, color: "bg-primary" },
    { name: "Cotton", percentage: 29.2, hectares: 11,  color: "bg-green-300" },
  ]

  const allTasks = todayAdvisories.length ? todayAdvisories.map((a, i) => ({
    id: a.id,
    name: a.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    status: a.severity === "high" ? "Urgent" : "In progress",
    color: i === 0 ? "bg-amber-400" : i === 1 ? "bg-primary" : "bg-muted",
  })) : [
    { id: 1, name: "Pruning Peaches",   status: "In progress", color: "bg-amber-400" },
    { id: 2, name: "Pruning Apples",    status: "In progress", color: "bg-primary"   },
    { id: 3, name: "Irrigation Check",  status: "Pending",     color: "bg-muted"     },
  ]

  const waterLevel = latestWeather?.humidity ?? 26.7
  const temperature = latestWeather?.temp_mean ?? 30
  const humidity = latestWeather?.humidity ?? 45
  const windSpeed = latestWeather?.wind_speed ?? 14
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
          <h1 className="text-3xl font-bold text-foreground">{farmName}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" className="rounded-full">
            Field Operations
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
          {allFarms.slice(0, 3).map((f) => (
            <Button
              key={f.id}
              variant={f.id === (selectedFarmId ?? farmId) ? "default" : "outline"}
              className={`rounded-full ${f.id === (selectedFarmId ?? farmId) ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setSelectedFarmId(f.id)}
            >
              {f.farm_name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Schedule Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <CardTitle className="text-base font-semibold">Schedule For The Day</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allTasks.slice(0, 2).map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${task.color}`} />
                      <span className="text-sm text-foreground">{task.name}</span>
                    </div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 rounded-full text-xs">
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-bold text-foreground">{today.getDate()}</span>
                <span className="text-lg text-muted-foreground">{today.toLocaleString("default", { month: "long" })}</span>
              </div>
            </CardContent>
          </Card>

          {/* My Farm Stats */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏠</span>
                <CardTitle className="text-base font-semibold">My Farm</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={`${humidity * 3.52} ${100 * 3.52}`}
                      className="text-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-foreground">{Math.round(humidity)}</span>
                    <span className="text-xs text-muted-foreground">Humidity</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Farm Acres */}
          <Card className="border-0 shadow-sm bg-primary text-primary-foreground">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🏠</span>
                <span className="text-sm font-medium">Farm Acres</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{timeline?.weather?.length ? Math.round(timeline.weather.length / 2) : 27}</span>
                <span className="text-sm opacity-80">ha · {cropName}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Crop Distribution */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌱</span>
                <CardTitle className="text-base font-semibold">Crop Distribution</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="16" className="text-muted" />
                    {cropDistribution.crops[0] && (
                      <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="16"
                        strokeDasharray={`${cropDistribution.crops[0].percentage * 2.51} ${100 * 2.51}`}
                        className="text-amber-400"
                      />
                    )}
                    {cropDistribution.crops[1] && (
                      <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="16"
                        strokeDasharray={`${cropDistribution.crops[1].percentage * 2.51} ${100 * 2.51}`}
                        strokeDashoffset={`${-cropDistribution.crops[0].percentage * 2.51}`}
                        className="text-primary"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-foreground">{cropDistribution.total}</span>
                    <span className="text-[10px] text-muted-foreground">ha total</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {cropDistribution.crops.map((crop) => (
                    <div key={crop.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${crop.color}`} />
                        <span className="text-muted-foreground">{crop.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-foreground font-medium">{crop.percentage}%</span>
                        <span className="text-muted-foreground ml-2">{crop.hectares.toFixed(1)} ha</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Yield */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⭐</span>
                  <CardTitle className="text-base font-semibold">Yield</CardTitle>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary/40" />
                    <span className="text-muted-foreground">Expected</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-destructive/60" />
                    <span className="text-muted-foreground">Actual</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-4xl font-bold text-foreground">{yieldData.total}</span>
                <span className="text-sm text-muted-foreground ml-2">{yieldData.unit}</span>
              </div>
              <div className="flex items-end justify-between h-32 gap-3">
                {yieldData.years.map((year) => (
                  <div key={year.year} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-1 h-24 items-end">
                      <div 
                        className="flex-1 bg-primary/40 rounded-t-sm"
                        style={{ height: `${year.expected}%` }}
                      />
                      <div 
                        className="flex-1 bg-destructive/60 rounded-t-sm"
                        style={{ height: `${year.actual}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{year.year}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All Tasks */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <CardTitle className="text-base font-semibold">All Tasks</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {allTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${task.color}`} />
                    <span className="text-sm text-foreground">{task.name}</span>
                  </div>
                  <Badge 
                    variant={task.status === "Pending" ? "secondary" : "default"}
                    className={`rounded-full text-xs ${
                      task.status === "In progress" 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {task.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Map & Weather */}
        <div className="lg:col-span-5 space-y-6">
          {/* Weather Bar */}
          <Card className="border-0 shadow-sm">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⛅</span>
                    <span className="text-sm font-medium">Weather</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">{Math.round(temperature)}</span>
                    <span className="text-lg text-muted-foreground">°C</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {/* Temperature Range from forecast */}
                  <div className="flex items-center gap-1">
                    {(weather.slice(0, 6).length ? weather.slice(0, 6) : [28,29,30,31,32,33].map(t => ({temp_mean:t}))).map((w, i) => (
                      <div key={i} className="text-center">
                        <span className="text-xs text-muted-foreground">{Math.round((w as WeatherForecast).temp_mean ?? 30)}°</span>
                        <div className={`w-6 h-1 rounded-full mt-1 ${i < 2 ? "bg-primary" : i < 4 ? "bg-accent" : "bg-destructive"}`} />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Cloud className="w-4 h-4" />
                    <span>{latestWeather?.rainfall ?? 0 > 0 ? "Rainy" : "Cloudy"}</span>
                    <Wind className="w-4 h-4 ml-2" />
                    <span>{Math.round(windSpeed)} km/h</span>
                    <Droplets className="w-4 h-4 ml-2" />
                    <span>{Math.round(humidity)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crop Cards */}
          <div className="flex gap-3">
            <Card className="flex-1 border-0 shadow-sm bg-green-50">
              <CardContent className="py-4 flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-2">
                  <span className="text-2xl">🍏</span>
                </div>
                <span className="text-sm font-medium text-foreground">Apples</span>
                <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                  <AlertTriangle className="w-3 h-3" />
                  <span>pest risk</span>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1 border-0 shadow-sm bg-red-50">
              <CardContent className="py-4 flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-2">
                  <span className="text-2xl">🍒</span>
                </div>
                <span className="text-sm font-medium text-foreground">Cherries</span>
                <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                  <AlertTriangle className="w-3 h-3" />
                  <span>pest risk</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0 relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-green-800 via-green-700 to-green-600 relative">
                {/* Simulated satellite map */}
                <div className="absolute inset-0 opacity-50">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }} />
                </div>
                
                {/* Field outline */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
                  <path
                    d="M100,80 L300,60 L320,220 L80,240 Z"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray="10,5"
                  />
                  {/* Heat map circles */}
                  <circle cx="200" cy="150" r="60" fill="url(#heatGradient)" opacity="0.8" />
                  <circle cx="240" cy="130" r="40" fill="#22c55e" opacity="0.7" />
                  <circle cx="180" cy="170" r="30" fill="#eab308" opacity="0.8" />
                  <defs>
                    <radialGradient id="heatGradient">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </radialGradient>
                  </defs>
                </svg>

                {/* Water Alert Card */}
                <div className="absolute top-4 right-4 bg-sidebar/95 backdrop-blur-sm rounded-xl p-4 text-sidebar-foreground w-44">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplet className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">Water</span>
                  </div>
                  <p className="text-xs text-destructive mb-2">
                    {waterLevel < 30 ? "Dangerous level" : waterLevel < 50 ? "Low level" : "Normal"}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-2 bg-sidebar-accent rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-destructive text-lg font-bold">▼</span>
                    <span className="text-2xl font-bold">{Math.round(waterLevel)}%</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs">
                      Watering
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 border-sidebar-border text-sidebar-foreground rounded-lg text-xs">
                      Snooze
                    </Button>
                  </div>
                </div>

                {/* Map Controls */}
                <div className="absolute left-4 bottom-4 flex flex-col gap-2">
                  <Button size="icon" variant="secondary" className="w-8 h-8 bg-sidebar/90 text-sidebar-foreground hover:bg-sidebar border-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="w-8 h-8 bg-sidebar/90 text-sidebar-foreground hover:bg-sidebar border-0">
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="w-8 h-8 bg-sidebar/90 text-sidebar-foreground hover:bg-sidebar border-0">
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="w-8 h-8 bg-sidebar/90 text-sidebar-foreground hover:bg-sidebar border-0">
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

