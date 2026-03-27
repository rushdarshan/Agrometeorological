"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { MyFarm } from "@/components/my-farm"
import { Advisories } from "@/components/advisories"
import { Profile } from "@/components/profile"
import { RegisterFarmerModal } from "@/components/register-farmer-modal"
import { MobileNav } from "@/components/mobile-nav"
import { useFarms } from "@/lib/api-client"

export default function Home() {
  const [activeView, setActiveView] = useState<"dashboard" | "farm" | "advisories" | "profile">("dashboard")
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>()
  const [showRegister, setShowRegister] = useState(false)

  // Fetch farms so user can navigate to them
  const { data: farms = [] } = useFarms("Kaira", 10)

  // Auto-select first farm on mount
  useEffect(() => {
    if (!selectedFarmId && Array.isArray(farms) && farms.length > 0) {
      setSelectedFarmId(farms[0].id)
    }
  }, [farms, selectedFarmId])

  const navigateToFarm = (farmId?: number) => {
    setSelectedFarmId(farmId)
    setActiveView("farm")
  }

  const handleViewAllTasks = () => {
    setActiveView("advisories")
  }

  const handleViewAllFields = () => {
    setActiveView("profile")
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:flex md:flex-col">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {activeView === "dashboard" && (
          <Dashboard
            onNavigateToFarm={navigateToFarm}
            onAddFarmer={() => setShowRegister(true)}
            onViewAllTasks={handleViewAllTasks}
            onViewAllFields={handleViewAllFields}
            userDistrict="Kaira"
            userName="Ramesh Patel"
          />
        )}
        {activeView === "farm"        && <MyFarm onBack={() => setActiveView("dashboard")} farmId={selectedFarmId} />}
        {activeView === "advisories"  && <Advisories />}
        {activeView === "profile"     && <Profile />}

        {/* Mobile bottom navigation - visible only on mobile */}
        <MobileNav activeView={activeView} setActiveView={setActiveView} />
      </main>

      {showRegister && (
        <RegisterFarmerModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => setShowRegister(false)}
        />
      )}
    </div>
  )
}
