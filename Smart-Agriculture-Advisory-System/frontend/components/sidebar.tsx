"use client"

import { cn } from "@/lib/utils"
import { LayoutDashboard, Sprout, FileText, User, Settings, Bell } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRef, useState } from "react"
import { NAVIGATION_ITEMS } from "@/lib/constants"
import { SettingsModal } from "@/components/shared/settings-modal"
import { NotificationsModal } from "@/components/shared/notifications-modal"

interface SidebarProps {
  activeView: "dashboard" | "farm" | "advisories" | "profile"
  setActiveView: (view: "dashboard" | "farm" | "advisories" | "profile") => void
}

// Map icon names to actual icon components
const ICON_MAP = {
  LayoutDashboard,
  Sprout,
  FileText,
  User,
} as const

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const navItems = NAVIGATION_ITEMS.map((item) => ({
    ...item,
    icon: ICON_MAP[item.iconName as keyof typeof ICON_MAP],
  }))

  const navRef = useRef<HTMLElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    const buttons = navRef.current?.querySelectorAll("button")
    if (!buttons) return

    const currentIndex = Array.from(buttons).findIndex(
      (btn) => btn.getAttribute("data-nav-id") === itemId
    )

    if (e.key === "ArrowDown") {
      e.preventDefault()
      const nextIndex = Math.min(currentIndex + 1, buttons.length - 1)
      setFocusedIndex(nextIndex)
      ;(buttons[nextIndex] as HTMLButtonElement).focus()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const prevIndex = Math.max(currentIndex - 1, 0)
      setFocusedIndex(prevIndex)
      ;(buttons[prevIndex] as HTMLButtonElement).focus()
    }
  }

  return (
    <TooltipProvider>
      <aside className="w-20 h-screen bg-sidebar flex flex-col items-center py-6 gap-4 border-r border-border fixed left-0 top-0 z-40 overflow-y-auto">
        {/* Logo */}
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-8">
          <Sprout className="w-7 h-7 text-primary-foreground" />
        </div>

        {/* Navigation with roving tabindex pattern */}
        <nav ref={navRef} className="flex-1 flex flex-col gap-4" role="navigation" aria-label="Main navigation">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            const isFocused = index === focusedIndex

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    data-nav-id={item.id}
                    onClick={() => setActiveView(item.id)}
                    onKeyDown={(e) => handleKeyDown(e, item.id)}
                    tabIndex={isFocused ? 0 : -1}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSettingsOpen(true)}
                aria-label="Settings"
                className="w-12 h-12 rounded-xl flex items-center justify-center text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Settings className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Settings
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setNotificationsOpen(true)}
                aria-label="Notifications (You have unread notifications)"
                className="w-12 h-12 rounded-xl flex items-center justify-center text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Notifications
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>

      {/* Modals */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <NotificationsModal isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </TooltipProvider>
  )
}

