"use client"

import { useState, useEffect } from "react"
import { TopNavigation, type ViewType } from "@/components/top-navigation"
import { Dashboard } from "@/components/dashboard"
import { MyFarm } from "@/components/my-farm"
import { Advisories } from "@/components/advisories"
import { Profile } from "@/components/profile"
import { MLPredict } from "@/components/ml-predict"
import { MapView } from "@/components/map-view"
import { RegisterFarmerModal } from "@/components/register-farmer-modal"
import { useFarms } from "@/lib/api-client"

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>("dashboard")
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>()
  const [showRegister, setShowRegister] = useState(false)

  // Fetch farms so user can navigate to them
  const { data: farmsData } = useFarms("Kanchipuram", 10)
  const farms = (farmsData as any[]) || []

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
    setActiveView("advisories")
  }

  const handleViewAllFields = () => {
    setActiveView("profile")
  }

  return (
    <div className="flex flex-col min-h-screen bg-background relative pt-32 pb-12 px-6 lg:px-12">
      <TopNavigation activeView={activeView} setActiveView={setActiveView} onAddFarmer={() => setShowRegister(true)} />
      
      <main className="flex-1 w-full max-w-7xl mx-auto overflow-hidden">
        {activeView === "dashboard" && (
          <Dashboard
            onNavigateToFarm={navigateToFarm}
            onAddFarmer={() => setShowRegister(true)}
            onViewAllTasks={handleViewAllTasks}
            onViewAllFields={handleViewAllFields}
            userDistrict="Kanchipuram"
            userName="Murugan Selvam"
          />
        )}
        {activeView === "farm" && <MyFarm onBack={() => setActiveView("dashboard")} farmId={selectedFarmId} />}
        {activeView === "map" && <MapView />}
        {activeView === "predict" && <MLPredict />}
        {activeView === "advisories" && <Advisories />}
        {activeView === "profile" && <Profile />}
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
