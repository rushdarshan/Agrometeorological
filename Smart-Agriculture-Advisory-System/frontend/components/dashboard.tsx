"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ArrowUpRight, CloudRain, Droplets, MapPin, Sprout, Sun, Thermometer, Wind } from "lucide-react"
import { useDashboardStats, useFarms } from "@/lib/api-client"
import { DISTRICTS } from "@/lib/constants"
import { useState, useEffect } from "react"
import Image from "next/image"

interface DashboardProps {
  onNavigateToFarm: (farmId?: number) => void
  onAddFarmer?: () => void
  onViewAllTasks?: () => void
  onViewAllFields?: () => void
  userDistrict?: string
  userName?: string
}

export function Dashboard({ onNavigateToFarm, onAddFarmer, onViewAllTasks, onViewAllFields, userDistrict, userName }: DashboardProps) {
  const [selectedDistrict, setSelectedDistrict] = useState(userDistrict || DISTRICTS[0])
  
  // React Query hooks
  const { data: stats, isLoading: statsLoading } = useDashboardStats(selectedDistrict)
  const { data: farms = [], isLoading: farmsLoading } = useFarms(selectedDistrict, 6)

  const highCount = Math.ceil((stats?.active_advisories_count || 0) * 0.3)
  const medCount = Math.ceil((stats?.active_advisories_count || 0) * 0.4)
  const lowCount = Math.ceil((stats?.active_advisories_count || 0) * 0.3)

  return (
    <div className="w-full flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* ── Title Section ──────────────────────────────────────────── */}
      <div className="text-center pt-8 pb-4">
        <h1 className="font-heading text-4xl lg:text-5xl font-extrabold text-[#0B3D2E] tracking-tight">
          What Is Our Success?
        </h1>
        <p className="text-[#6b7280] font-medium mt-3 text-lg">
          Transforming {selectedDistrict} with precision agriculture.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── Massive Hero Card (Alerts & Health) ──────────────────── */}
        <div className="lg:col-span-8 group">
          <Card className="relative h-[400px] rounded-[2.5rem] overflow-hidden border-0 bg-white shadow-xl shadow-black/5 flex items-stretch">
            {/* Background Image (Right 60%) */}
            <div 
              className="absolute top-0 right-0 w-[65%] h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=1200)' }}
            />
            
            {/* Gradient Overlay left to right */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-transparent w-[60%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-40 mix-blend-multiply" />

            {/* Content Left */}
            <div className="relative z-10 p-10 flex flex-col justify-between w-full lg:w-[60%]">
              <div>
                <Badge className="bg-[#355ca8]/10 text-[#355ca8] hover:bg-[#355ca8]/20 rounded-full px-4 py-1.5 font-bold mb-4 border-0">
                  Regional Health Overview
                </Badge>
                <h2 className="font-heading text-4xl font-extrabold text-[#0B3D2E] leading-tight mb-2">
                  Ecosystem <br/> Stability
                </h2>
                <p className="text-[#6b7280] font-medium leading-relaxed max-w-sm">
                  Active monitoring streams detect early warning signs across connected fields.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-8">
                <div>
                  <p className="text-sm font-bold text-[#6b7280] tracking-wider uppercase mb-1">Total</p>
                  <p className="font-heading text-5xl font-black text-[#0B3D2E]">{stats?.active_advisories_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#6b7280] tracking-wider uppercase mb-1">High Risk</p>
                  <p className="font-heading text-5xl font-black text-[#da3633]">{highCount}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#6b7280] tracking-wider uppercase mb-1">Minor</p>
                  <p className="font-heading text-5xl font-black text-[#89ADFF]">{lowCount}</p>
                </div>
              </div>
            </div>

            {/* Floating Badges on the right image */}
            <div className="absolute top-8 right-8 z-10 flex flex-col gap-3 items-end">
              <div className="bg-white/90 backdrop-blur-md rounded-full px-5 py-2.5 shadow-lg flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#396756] animate-pulse" />
                <span className="font-bold text-[#0B3D2E] text-sm">Real-time Sync Active</span>
              </div>
            </div>
            
            {/* View All action */}
            <button 
              onClick={onViewAllTasks}
              className="absolute bottom-8 right-8 z-10 bg-[#0B3D2E] hover:bg-[#082b20] text-white rounded-full p-4 shadow-xl transition-all hover:scale-110"
            >
              <ArrowUpRight className="w-6 h-6" />
            </button>
          </Card>
        </div>

        {/* ── Weather Micro-climate Card ──────────────────────────── */}
        <div className="lg:col-span-4 group h-full">
          <Card className="relative h-full min-h-[400px] rounded-[2.5rem] overflow-hidden border-0 bg-[#355ca8] text-white shadow-xl shadow-[#355ca8]/20 flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            
            <div className="p-8 flex-1 flex flex-col justify-between relative z-10">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <Badge className="bg-white/20 text-white hover:bg-white/30 rounded-full px-4 py-1.5 border-0">Micro-climate</Badge>
                  <Sun className="w-8 h-8 text-[#FFB000]" />
                </div>
                
                <p className="text-white/70 font-medium mb-1">Current avg</p>
                <h3 className="font-heading text-7xl font-black tracking-tighter">
                  {farms?.[0]?.last_weather?.temp_mean?.toFixed(0) || "28"}°<span className="text-4xl text-white/50">C</span>
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-black/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Droplets className="w-5 h-5 text-[#89ADFF]" />
                    <span className="font-semibold text-white/90">Humidity</span>
                  </div>
                  <span className="font-bold text-lg">{farms?.[0]?.last_weather?.humidity?.toFixed(0) || "65"}%</span>
                </div>
                <div className="bg-black/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CloudRain className="w-5 h-5 text-[#89ADFF]" />
                    <span className="font-semibold text-white/90">Rainfall</span>
                  </div>
                  <span className="font-bold text-lg">{farms?.[0]?.last_weather?.rainfall?.toFixed(0) || "0"}mm</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* ── Fields Innovation Cards ─────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="font-heading text-2xl font-extrabold text-[#0B3D2E] tracking-tight">Active Ecosystems</h2>
          <button onClick={onViewAllFields} className="text-[#355ca8] font-bold text-sm hover:underline">
            View All Network →
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {farmsLoading ? (
            [1, 2, 3].map(i => <div key={i} className="h-64 bg-black/5 rounded-[2rem] animate-pulse" />)
          ) : farms?.length ? (
            farms.slice(0, 3).map((farm: any, i: number) => (
              <Card 
                key={farm.id} 
                onClick={() => onNavigateToFarm(farm.id)}
                className="group relative h-72 rounded-[2rem] overflow-hidden border-0 cursor-pointer shadow-lg shadow-black/5"
              >
                {/* Images per index to mimic vertical farming aesthetics */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ 
                    backgroundImage: `url(${
                      i === 0 ? 'https://images.unsplash.com/photo-1592982537447-6f2da1dc5f2e?auto=format&fit=crop&q=80&w=600' :
                      i === 1 ? 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=600' :
                      'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&q=80&w=600'
                    })` 
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading text-2xl font-bold text-white mb-1">{farm.farm_name}</h3>
                      <p className="text-white/70 font-medium flex items-center gap-1.5 text-sm">
                        <MapPin className="w-3.5 h-3.5" /> {farm.village}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Badge className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-0 font-medium tracking-wide rounded-full">
                      {farm.crop_name}
                    </Badge>
                    <Badge className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-0 font-medium tracking-wide rounded-full">
                      {farm.area_hectares} ha
                    </Badge>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-3 h-64 border-2 border-dashed border-[#e5e5e5] rounded-[2rem] flex flex-col items-center justify-center text-[#6b7280]">
              <Sprout className="w-12 h-12 mb-4 text-[#e5e5e5]" />
              <p className="font-bold text-lg">No active ecosystems found</p>
              <button onClick={onAddFarmer} className="text-[#355ca8] font-bold mt-2 hover:underline">Initialize a new farm</button>
            </div>
          )}
        </div>
      </div>
      
    </div>
  )
}
