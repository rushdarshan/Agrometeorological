"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, CloudRain, Droplets, Leaf, MapPin, Sprout, Sun, Thermometer, Wind } from "lucide-react"
import { useFarmTimeline, useFarmWeather } from "@/lib/api-client"
import type { Farm, Advisory } from "@/lib/types"
import { ReportHarvestModal } from "./report-harvest-modal"

interface MyFarmProps {
  onBack: () => void
  farmId?: number
}

export function MyFarm({ onBack, farmId }: MyFarmProps) {
  const { data: timeline = null, isLoading: timelineLoading } = useFarmTimeline(farmId ?? 0, 30)
  const { data: weatherData = {}, isLoading: weatherLoading } = useFarmWeather(farmId ?? 0)

  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!farmId && !timelineLoading) {
    return (
      <div className="p-8 text-center pt-24 animate-in fade-in">
        <Button variant="outline" className="rounded-full mb-6 font-bold" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Intelligence
        </Button>
        <p className="font-heading text-2xl text-[#1a1c1c] font-black tracking-tight">No ecosystem selected.</p>
      </div>
    )
  }

  const weather = (weatherData as any)?.daily?.[0] || (weatherData as any)?.summary
  const advisories = (timeline as any)?.advisories || []
  const farmInfo = timeline as any

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ── Control Bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-8 px-2">
        <Button variant="ghost" onClick={onBack} className="rounded-full hover:bg-[#355ca8]/10 text-[#355ca8] font-bold">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Grid
        </Button>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-t from-[#0B3D2E] to-[#396756] text-white rounded-full px-6 py-5 shadow-lg shadow-[#0B3D2E]/20 hover:scale-105 transition-all font-bold"
        >
          <Leaf className="w-4 h-4 mr-2" /> Log Harvest Data
        </Button>
      </div>

      {/* ── Hero Image & Floating Bubbles ────────────────────────── */}
      <div className="relative w-full h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#0B3D2E]">
        {/* Farm Imagery Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&q=80&w=1200)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent w-1/2" />

        {/* Bottom Left Content */}
        <div className="absolute bottom-10 left-10 z-10 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-0 px-4 py-1.5 font-bold tracking-wide rounded-full">
              {farmInfo?.crop_name || "Mixed Crop"}
            </Badge>
            <Badge className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-0 px-4 py-1.5 font-bold tracking-wide rounded-full">
              {farmInfo?.area_hectares || "5.0"} ha
            </Badge>
          </div>
          <h1 className="font-heading text-5xl font-black mb-2 tracking-tight">
            {farmInfo?.farm_name || "Loading Ecosystem..."}
          </h1>
          <p className="text-white/80 font-medium flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5" /> {farmInfo?.village || "Location pending"}
          </p>
        </div>

        {/* Right Floating Environment Bubbles */}
        <div className="absolute top-10 right-10 z-10 flex flex-col gap-4">
          <div className="bg-white/10 backdrop-blur-[20px] rounded-[1.5rem] p-5 shadow-lg border border-white/10 text-white w-48 text-center" style={{ outline: '1px solid rgba(255,255,255,0.05)' }}>
             <Thermometer className="w-6 h-6 mx-auto mb-2 text-[#FFB000]" />
             <p className="text-xs uppercase font-bold text-white/60 tracking-wider">Temperature</p>
             <p className="font-heading text-3xl font-black mt-1">{weather?.temp_mean?.toFixed(0) || "28"}°C</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-[20px] rounded-[1.5rem] p-5 shadow-lg border border-white/10 text-white w-48 text-center">
             <Droplets className="w-6 h-6 mx-auto mb-2 text-[#89ADFF]" />
             <p className="text-xs uppercase font-bold text-white/60 tracking-wider">Humidity & Rain</p>
             <p className="font-heading text-xl font-bold mt-1">{weather?.humidity?.toFixed(0) || "65"}% / {weather?.rainfall?.toFixed(0) || "0"}mm</p>
          </div>
        </div>
      </div>

      {/* ── Intelligence Feed ──────────────────────────────────────── */}
      <div className="mt-4">
        <h2 className="font-heading text-3xl font-extrabold text-[#0B3D2E] mb-6 pl-2 tracking-tight">Ecosystem Intelligence</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {advisories.length > 0 ? advisories.map((advisory: any, idx: number) => {
            const isHigh = advisory.severity === "high"
            const bgClass = isHigh ? "bg-[#da3633]/5 text-[#da3633]" : "bg-white text-[#0B3D2E]"
            return (
              <Card key={advisory.id} className={`${bgClass} border-0 shadow-lg rounded-[2rem] p-6 transition-all hover:-translate-y-1 hover:shadow-xl`}>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={`rounded-full border-0 font-bold px-3 py-1 ${isHigh ? "bg-[#da3633] text-white" : "bg-[#89ADFF]/20 text-[#355ca8]"}`}>
                    {advisory.severity.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-bold opacity-60">
                    {new Date(advisory.generated_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-heading text-xl font-black mb-2 capitalize">{advisory.advisory_type.replace(/_/g, " ")}</h3>
                <p className="text-[#1a1c1c]/80 font-medium leading-relaxed">{advisory.message}</p>
              </Card>
            )
          }) : (
            <div className="col-span-2 py-10 text-center bg-white rounded-[2rem]">
              <Sprout className="w-12 h-12 text-[#e5e5e5] mx-auto mb-3" />
              <p className="font-bold text-[#6b7280]">No anomalies detected in this ecosystem.</p>
            </div>
          )}
        </div>
      </div>

      <ReportHarvestModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        farmId={farmId}
        defaultCrop={farmInfo?.crop_name}
        weatherSummary={weather} 
      />
    </div>
  )
}
