"use client"

import { LayoutDashboard, Leaf, AlertCircle, User } from "lucide-react"

interface MobileNavProps {
  activeView: "dashboard" | "farm" | "advisories" | "profile"
  setActiveView: (view: "dashboard" | "farm" | "advisories" | "profile") => void
}

export function MobileNav({ activeView, setActiveView }: MobileNavProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "farm", label: "My Farm", icon: Leaf },
    { id: "advisories", label: "Tasks", icon: AlertCircle },
    { id: "profile", label: "Profile", icon: User },
  ] as const

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg"
      aria-label="Mobile navigation"
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id as typeof activeView)}
            className={`flex flex-col items-center justify-center flex-1 h-16 transition-colors ${
              activeView === id
                ? "text-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label={label}
            aria-current={activeView === id ? "page" : undefined}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
