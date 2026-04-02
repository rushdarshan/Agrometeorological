"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, AlertCircle, Loader2 } from "lucide-react"
import { useFarms } from "@/lib/api-client"
import dynamic from "next/dynamic"

// Dynamically import Leaflet components (SSR incompatible)
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
)
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
)
const CircleMarker = dynamic(
    () => import("react-leaflet").then((mod) => mod.CircleMarker),
    { ssr: false }
)
const Popup = dynamic(
    () => import("react-leaflet").then((mod) => mod.Popup),
    { ssr: false }
)

function getSeverityColor(severity?: string): string {
    switch (severity) {
        case "high":
            return "#dc2626" // red
        case "medium":
            return "#f59e0b" // amber
        case "low":
            return "#22c55e" // green
        default:
            return "#22c55e" // green for no advisory
    }
}

function getSeverityLabel(severity?: string): string {
    switch (severity) {
        case "high":
            return "High"
        case "medium":
            return "Medium"
        case "low":
            return "Low"
        default:
            return "No advisory"
    }
}

export function MapView() {
    const [isClient, setIsClient] = useState(false)
    const { data: farms = [], isLoading, isError } = useFarms("Kanchipuram", 50)

    // Only render the map on the client side
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Import leaflet CSS on client
    useEffect(() => {
        if (isClient) {
            import("leaflet/dist/leaflet.css")
        }
    }, [isClient])

    // Filter farms with valid lat/lon
    const mappableFarms = farms.filter(
        (f: any) => f.lat != null && f.lon != null && !isNaN(f.lat) && !isNaN(f.lon)
    )

    // Center on Tamil Nadu (Kanchipuram district area)
    const center: [number, number] = mappableFarms.length > 0
        ? [
            mappableFarms.reduce((sum: number, f: any) => sum + f.lat, 0) / mappableFarms.length,
            mappableFarms.reduce((sum: number, f: any) => sum + f.lon, 0) / mappableFarms.length,
        ]
        : [12.83, 79.70] // Default to Kanchipuram, Tamil Nadu

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <MapPin className="w-8 h-8 text-primary" />
                    Farm Map
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Geographic overview with advisory severity pins
                </p>
            </div>

            {/* Map Card */}
            <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-primary">
                        Farm Locations — click a pin for details
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="h-[500px] flex items-center justify-center bg-muted/10">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Loading farm locations...
                            </div>
                        </div>
                    ) : isError ? (
                        <div className="h-[500px] flex items-center justify-center bg-destructive/5">
                            <div className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="w-5 h-5" />
                                Failed to load farm data. Please try again.
                            </div>
                        </div>
                    ) : !isClient ? (
                        <div className="h-[500px] flex items-center justify-center bg-muted/10">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Loading map...
                            </div>
                        </div>
                    ) : (
                        <div className="h-[500px]">
                            <MapContainer
                                center={center}
                                zoom={9}
                                scrollWheelZoom={true}
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {mappableFarms.map((farm: any) => {
                                    const severity = farm.last_advisory?.severity
                                    const color = getSeverityColor(severity)
                                    return (
                                        <CircleMarker
                                            key={farm.id}
                                            center={[farm.lat, farm.lon]}
                                            radius={10}
                                            pathOptions={{
                                                color: color,
                                                fillColor: color,
                                                fillOpacity: 0.8,
                                                weight: 2,
                                            }}
                                        >
                                            <Popup>
                                                <div className="min-w-[200px] p-1">
                                                    <h3 className="font-bold text-sm mb-1">{farm.farm_name}</h3>
                                                    <div className="space-y-1 text-xs">
                                                        <p>
                                                            <span className="text-gray-500">Crop:</span>{" "}
                                                            <span className="font-medium">{farm.crop_name}</span>
                                                        </p>
                                                        <p>
                                                            <span className="text-gray-500">Farmer:</span>{" "}
                                                            <span className="font-medium">{farm.farmer_name}</span>
                                                        </p>
                                                        <p>
                                                            <span className="text-gray-500">Area:</span>{" "}
                                                            <span className="font-medium">{farm.area_hectares} ha</span>
                                                        </p>
                                                        <p>
                                                            <span className="text-gray-500">Village:</span>{" "}
                                                            <span className="font-medium">{farm.village}</span>
                                                        </p>
                                                        {farm.last_advisory ? (
                                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                                <p className="font-medium text-xs">
                                                                    Advisory: {farm.last_advisory.advisory_type?.replace(/_/g, " ")}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-0.5">
                                                                    Severity:{" "}
                                                                    <span
                                                                        className="font-medium"
                                                                        style={{ color: getSeverityColor(farm.last_advisory.severity) }}
                                                                    >
                                                                        {getSeverityLabel(farm.last_advisory.severity)}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <p className="mt-2 pt-2 border-t border-gray-200 text-gray-400 italic text-xs">
                                                                No active advisory
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </Popup>
                                        </CircleMarker>
                                    )
                                })}
                            </MapContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="font-medium">Pin colors:</span>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-600" />
                    <span>High severity</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>Medium</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Low / No advisory</span>
                </div>
            </div>

            {/* Farm Stats */}
            {mappableFarms.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-sm">
                        <CardContent className="pt-4 pb-4 text-center">
                            <p className="text-2xl font-bold text-primary">{mappableFarms.length}</p>
                            <p className="text-xs text-muted-foreground">Farms on Map</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm">
                        <CardContent className="pt-4 pb-4 text-center">
                            <p className="text-2xl font-bold text-red-600">
                                {mappableFarms.filter((f: any) => f.last_advisory?.severity === "high").length}
                            </p>
                            <p className="text-xs text-muted-foreground">High Severity</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm">
                        <CardContent className="pt-4 pb-4 text-center">
                            <p className="text-2xl font-bold text-amber-600">
                                {mappableFarms.filter((f: any) => f.last_advisory?.severity === "medium").length}
                            </p>
                            <p className="text-xs text-muted-foreground">Medium Severity</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm">
                        <CardContent className="pt-4 pb-4 text-center">
                            <p className="text-2xl font-bold text-green-600">
                                {mappableFarms.filter((f: any) => !f.last_advisory || f.last_advisory?.severity === "low").length}
                            </p>
                            <p className="text-xs text-muted-foreground">Low / Safe</p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
