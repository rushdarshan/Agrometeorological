"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { MyFarm } from "@/components/my-farm"
import { Advisories } from "@/components/advisories"
import { Profile } from "@/components/profile"
import { RegisterFarmerModal } from "@/components/register-farmer-modal"
import { useFarms } from "@/lib/api-client"

export default function Home() {
  const [activeView, setActiveView] = useState<"dashboard" | "farm" | "advisories" | "profile">("dashboard")
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>()
  const [showRegister, setShowRegister] = useState(false)

  // Fetch farms so user can navigate to them
  const { data: farms = [] } = useFarms("Kaira", 10)

  // Auto-select first farm on mount
  useEffect(() => {
    if (!selectedFarmId && farms.length > 0) {
      setSelectedFarmId(farms[0].id)
    }
  }, [farms, selectedFarmId])

  const navigateToFarm = (farmId?: number) => {
    setSelectedFarmId(farmId)
    setActiveView("farm")
  }

  const handleViewAllTasks = () => {
    // Navigate to advisories page to see all tasks/advisories
    setActiveView("advisories")
  }

  const handleViewAllFields = () => {
    // Navigate to profile to see all farms/fields
    setActiveView("profile")
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 overflow-auto">
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
