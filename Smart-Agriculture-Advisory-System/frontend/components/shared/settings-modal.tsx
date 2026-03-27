"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true)
  const [dataReportsEnabled, setDataReportsEnabled] = useState(true)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("appSettings")
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        setNotificationsEnabled(settings.notificationsEnabled ?? true)
        setEmailAlertsEnabled(settings.emailAlertsEnabled ?? true)
        setDataReportsEnabled(settings.dataReportsEnabled ?? true)
      } catch (e) {
        console.error("Failed to load settings:", e)
      }
    }
  }, [isOpen])

  const handleSave = () => {
    const settings = {
      notificationsEnabled,
      emailAlertsEnabled,
      dataReportsEnabled,
    }
    localStorage.setItem("appSettings", JSON.stringify(settings))
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your app preferences and notifications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Notifications Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Notifications</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications" className="text-sm font-normal">
                Push Notifications
              </Label>
              <Switch
                id="push-notifications"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-alerts" className="text-sm font-normal">
                Email Alerts
              </Label>
              <Switch
                id="email-alerts"
                checked={emailAlertsEnabled}
                onCheckedChange={setEmailAlertsEnabled}
              />
            </div>
          </div>

          {/* Data & Reports Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Data & Reports</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="data-reports" className="text-sm font-normal">
                Share Monthly Reports
              </Label>
              <Switch
                id="data-reports"
                checked={dataReportsEnabled}
                onCheckedChange={setDataReportsEnabled}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
