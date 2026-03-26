"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Calendar, Edit, ChevronRight } from "lucide-react"
import { getRegionalStats, getFarms, type FarmSummary } from "@/lib/api"

export function Profile() {
  const [farms, setFarms] = useState<FarmSummary[]>([])
  const [totalFarms, setTotalFarms] = useState<number>(12)
  const [totalAdvisories, setTotalAdvisories] = useState<number>(5)
  const [engagement, setEngagement] = useState<number>(78)

  useEffect(() => {
    getRegionalStats("Kaira").then(s => {
      setTotalFarms(s.total_farms)
      setTotalAdvisories(s.active_advisories_count)
      setEngagement(Math.round(s.avg_engagement_rate))
    }).catch(() => {})
    getFarms("Kaira", 20).then(setFarms).catch(() => {})
  }, [])

  const profileStats = [
    { label: "Farms",       value: String(totalFarms),     color: "text-primary"    },
    { label: "Advisories",  value: String(totalAdvisories), color: "text-foreground" },
    { label: "Engagement",  value: `${engagement}%`,        color: "text-accent"     },
  ]

  const recentActivity = farms.slice(0, 5).filter(f => f.last_advisory).map(f => ({
    id: f.id,
    action: f.last_advisory!.advisory_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    field: f.farm_name,
    time: new Date(f.last_advisory!.generated_at).toLocaleDateString("en-IN"),
  })).concat(farms.slice(0,2).map(f => ({
    id: f.id + 1000,
    action: "Farm data updated",
    field: f.farm_name,
    time: "Recently",
  }))).slice(0, 4)

  const displayActivity = recentActivity.length ? recentActivity : [
    { id: 1, action: "Completed irrigation check", field: "Rice Field Alpha",  time: "2 hours ago" },
    { id: 2, action: "Applied fertilizer",         field: "Wheat Plot Beta",   time: "Yesterday"   },
    { id: 3, action: "Updated crop schedule",      field: "Cotton Farm Gamma", time: "2 days ago"  },
  ]

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <div className="flex items-center gap-3">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
          <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center">
            <span className="text-lg">👨‍🌾</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                <span className="text-5xl">👨‍🌾</span>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Farmer Profile</h2>
              <div className="flex items-center gap-1 text-muted-foreground mb-6">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Kaira District, Gujarat</span>
              </div>
              
              <div className="flex items-center justify-center gap-8 w-full py-4 border-t border-b border-border">
                {profileStats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Member since January 2024</span>
              </div>

              <Button variant="outline" className="mt-6 rounded-full">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                See all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {displayActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div>
                    <p className="font-medium text-foreground capitalize">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.field}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* My Farms */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">My Farms</CardTitle>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Manage <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {(farms.length ? farms : [
                { id: 1, farm_name: "Rice Field Alpha",  area_hectares: 11, crop_name: "Rice"   },
                { id: 2, farm_name: "Wheat Plot Beta",   area_hectares: 20, crop_name: "Wheat"  },
                { id: 3, farm_name: "Cotton Farm Gamma", area_hectares: 15, crop_name: "Cotton" },
              ]).slice(0,5).map((farm) => (
                <div key={farm.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">🌾</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{farm.farm_name}</p>
                      <p className="text-sm text-muted-foreground">{farm.area_hectares} ha · {farm.crop_name}</p>
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 rounded-full">Active</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 rounded-xl">
                  <span className="text-2xl">🌱</span>
                  <span className="text-sm">Add Crop</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 rounded-xl">
                  <span className="text-2xl">📊</span>
                  <span className="text-sm">View Reports</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 rounded-xl">
                  <span className="text-2xl">⚙️</span>
                  <span className="text-sm">Settings</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 rounded-xl">
                  <span className="text-2xl">❓</span>
                  <span className="text-sm">Help</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
