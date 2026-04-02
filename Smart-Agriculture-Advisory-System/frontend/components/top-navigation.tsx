"use client"

import { cn } from "@/lib/utils"
import { Sprout, LayoutDashboard, Map, Brain, FileText, User } from "lucide-react"

export type ViewType = "dashboard" | "farm" | "advisories" | "profile" | "map" | "predict"

interface TopNavigationProps {
  activeView: ViewType
  setActiveView: (view: ViewType) => void
  onAddFarmer: () => void
}

export function TopNavigation({ activeView, setActiveView, onAddFarmer }: TopNavigationProps) {
  const navItems = [
    { id: "dashboard" as const, icon: LayoutDashboard, label: "Home" },
    { id: "advisories" as const, icon: FileText, label: "Alerts" },
    { id: "farm" as const, icon: Sprout, label: "Farm" },
    { id: "map" as const, icon: Map, label: "Map" },
    { id: "predict" as const, icon: Brain, label: "Predict" },
    { id: "profile" as const, icon: User, label: "Profile" },
  ]

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
      <div className="flex items-center justify-between p-2 pl-6 pr-3 rounded-full bg-white/70 backdrop-blur-[20px] shadow-xl shadow-black/5" style={{ outline: '1px solid rgba(0,0,0,0.03)' }}>
        
        {/* Logo Section */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveView("dashboard")}>
          <div className="w-10 h-10 rounded-full bg-[#0B3D2E] flex items-center justify-center shadow-lg shadow-[#0B3D2E]/20 transition-transform group-hover:scale-105">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-extrabold tracking-tight text-[#0B3D2E] text-xl hidden md:block">GrowWise</span>
        </div>

        {/* Navigation Pills */}
        <nav className="flex items-center gap-1 md:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 font-semibold tracking-tight",
                  isActive
                    ? "bg-[#355ca8]/10 text-[#355ca8]"
                    : "text-[#6b7280] hover:bg-[#f3f3f3] hover:text-[#1a1c1c]"
                )}
              >
                <Icon className={cn("w-[18px] h-[18px]", isActive ? "text-[#355ca8]" : "opacity-70")} />
                <span className={cn("text-[13px]", "hidden sm:block")}>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Primary CTA */}
        <button 
          onClick={onAddFarmer}
          className="flex items-center gap-2 bg-gradient-to-t from-[#355ca8] to-[#89ADFF] text-white px-6 py-3 rounded-full shadow-lg shadow-[#355ca8]/30 hover:scale-105 hover:shadow-xl hover:shadow-[#355ca8]/40 transition-all duration-300 font-bold tracking-tight text-sm"
        >
          <span className="hidden sm:inline">Register Farmer</span>
          <span className="sm:hidden">Register</span>
        </button>

      </div>
    </div>
  )
}
