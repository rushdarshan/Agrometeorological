"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, AlertCircle, Info, CheckCircle } from "lucide-react"
import { useState } from "react"

interface Notification {
  id: string
  type: "warning" | "info" | "success"
  title: string
  message: string
  timestamp: string
  read: boolean
}

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "warning",
      title: "Low soil moisture",
      message: "Field #1 requires immediate irrigation",
      timestamp: "2 hours ago",
      read: false,
    },
    {
      id: "2",
      type: "info",
      title: "Advisory updated",
      message: "New crop advisory available for your district",
      timestamp: "4 hours ago",
      read: false,
    },
    {
      id: "3",
      type: "success",
      title: "Data synced",
      message: "Farm data successfully synchronized",
      timestamp: "1 day ago",
      read: true,
    },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="w-5 h-5 text-destructive" />
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[600px] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Notifications</DialogTitle>
              <DialogDescription>
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                  : "All notifications read"}
              </DialogDescription>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex gap-4 p-3 rounded-lg border transition-colors cursor-pointer ${
                  notification.read
                    ? "bg-background border-border"
                    : "bg-blue-50 border-blue-200"
                }`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {notification.timestamp}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(notification.id)
                  }}
                  className="flex-shrink-0 hover:opacity-60 transition-opacity"
                  aria-label={`Delete notification: ${notification.title}`}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
