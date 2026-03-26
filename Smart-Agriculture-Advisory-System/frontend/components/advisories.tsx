"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ChevronRight } from "lucide-react"
import { getRegionalStats, getFarms, type RegionalStats, type FarmSummary } from "@/lib/api"

const defaultAdvisoryTypes = [
  { name: "Irrigation", count: 3 },
  { name: "Fertilizer", count: 2 },
  { name: "Pest Control", count: 1 },
]

export function Advisories() {
  const [stats, setStats] = useState<RegionalStats | null>(null)
  const [farms, setFarms] = useState<FarmSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getRegionalStats("Kaira"), getFarms("Kaira", 20)])
      .then(([s, f]) => { setStats(s); setFarms(f) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statsCards = [
    { label: "Total Farms",       value: stats?.total_farms ?? 12,                        subtext: "ACTIVE REGION",       color: "text-primary" },
    { label: "Total Farmers",     value: stats?.total_farmers ?? 9,                       subtext: "REGISTERED USERS",    color: "text-primary" },
    { label: "Active Advisories", value: stats?.active_advisories_count ?? 5,             subtext: "LAST 7 DAYS",         color: "text-primary" },
    { label: "Engagement Rate",   value: `${stats?.avg_engagement_rate ?? 78}%`,          subtext: "FARMER INTERACTION",  color: "text-accent"  },
  ]

  const advisoryTypes = stats?.advisory_type_distribution
    ? Object.entries(stats.advisory_type_distribution).map(([name, count]) => ({ name, count }))
    : defaultAdvisoryTypes

  // Derive recent advisories from farms' last_advisory
  const recentAdvisories = farms
    .filter(f => f.last_advisory)
    .slice(0, 6)
    .map(f => ({
      id: f.last_advisory!.id,
      title: f.last_advisory!.advisory_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      description: f.last_advisory!.message.slice(0, 100),
      type: f.last_advisory!.advisory_type,
      farm: f.farm_name,
      date: new Date(f.last_advisory!.generated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      priority: f.last_advisory!.severity === "high" ? "High" : "Medium",
    }))

  const displayAdvisories = recentAdvisories.length ? recentAdvisories : [
    { id: 1, title: "Irrigation Schedule Update", description: "Reduce watering frequency due to expected rainfall", type: "Irrigation", farm: "Rice Field Alpha", date: "Mar 5, 2026", priority: "High" },
    { id: 2, title: "Fertilizer Application",     description: "Apply nitrogen-based fertilizer to wheat plots",  type: "Fertilizer",  farm: "Wheat Plot Beta",  date: "Mar 4, 2026", priority: "Medium" },
    { id: 3, title: "Pest Alert: Aphids",         description: "Monitor rice fields for aphid infestation",       type: "Pest Control",farm: "Cotton Farm",      date: "Mar 3, 2026", priority: "High" },
  ]

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">Advisories</h1>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
              <p className={`text-4xl font-bold ${stat.color}`}>{loading ? "…" : stat.value}</p>
              <p className="text-xs text-muted-foreground mt-2 tracking-wider">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Advisory Types */}
      <Card className="border-0 shadow-sm mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">By Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {advisoryTypes.map((type) => (
            <div 
              key={type.name}
              className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
            >
              <span className="font-medium text-foreground capitalize">{type.name.replace(/_/g, " ")}</span>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 rounded-full">
                {type.count} active
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Advisories */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Advisories</CardTitle>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            See all <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayAdvisories.map((advisory) => (
            <div 
              key={advisory.id}
              className="flex items-start justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium text-foreground">{advisory.title}</h4>
                  <Badge variant={advisory.priority === "High" ? "destructive" : "secondary"} className="rounded-full text-xs">
                    {advisory.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{advisory.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="bg-muted px-2 py-1 rounded-md capitalize">{advisory.type.replace(/_/g, " ")}</span>
                  {"farm" in advisory && <span>{advisory.farm}</span>}
                  <span>{advisory.date}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
