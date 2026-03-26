"use client"

import { cn } from "@/lib/utils"
import { LayoutDashboard, Sprout, FileText, User, Settings, Bell } from "lucide-react"

interface SidebarProps {
  activeView: "dashboard" | "farm" | "advisories" | "profile"
  setActiveView: (view: "dashboard" | "farm" | "advisories" | "profile") => void
}

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const navItems = [
    { id: "dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
    { id: "farm" as const, icon: Sprout, label: "My Farm" },
    { id: "advisories" as const, icon: FileText, label: "Advisories" },
    { id: "profile" as const, icon: User, label: "Profile" },
  ]

  return (
    <aside className="w-20 bg-sidebar flex flex-col items-center py-6 gap-2">
      {/* Logo */}
      <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-8">
        <Sprout className="w-7 h-7 text-primary-foreground" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-2">
        <button className="w-12 h-12 rounded-xl flex items-center justify-center text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all">
          <Settings className="w-5 h-5" />
        </button>
        <button className="w-12 h-12 rounded-xl flex items-center justify-center text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all">
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </aside>
  )
}
