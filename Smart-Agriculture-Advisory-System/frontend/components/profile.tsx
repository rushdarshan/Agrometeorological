"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertCircle,
  CheckCircle2,
  MapPin,
  Calendar,
  Edit,
  ChevronRight,
  Plus,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react"
import { SkeletonLoader } from "@/components/shared/skeleton-loader"
import { LANGUAGES } from "@/lib/constants"
import type { Farmer } from "@/lib/types"

interface ProfileData extends Farmer {
  email?: string
  created_at?: string
}

export function Profile() {
  // Form state
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [formData, setFormData] = useState<Partial<ProfileData>>({
    name: "Ramesh Patel",
    phone: "+91 9876543210",
    email: "ramesh@example.com",
    village: "Mahisagar Village",
    district: "Kaira",
    state: "Gujarat",
    preferred_language: "gu",
  })

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const farms = [
    { id: 1, farm_name: "Rice Field Alpha", area_hectares: 11, crop_name: "Rice", status: "Active" },
    { id: 2, farm_name: "Wheat Plot Beta", area_hectares: 20, crop_name: "Wheat", status: "Active" },
    { id: 3, farm_name: "Cotton Farm Gamma", area_hectares: 15, crop_name: "Cotton", status: "Active" },
  ]

  const profileStats = [
    { label: "Farms", value: String(farms.length), color: "text-primary" },
    { label: "Advisories", value: "24", color: "text-foreground" },
    { label: "Engagement", value: "92%", color: "text-green-600" },
  ]

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      // Simulate API call - in production, use useUpdateProfile mutation
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSaveMessage({ type: "success", text: "Profile updated successfully!" })
      setIsEditMode(false)
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage({ type: "error", text: "Failed to save profile. Please try again." })
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      setSaveMessage({ type: "error", text: "Please fill in all password fields." })
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveMessage({ type: "error", text: "New passwords do not match." })
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSaveMessage({ type: "success", text: "Password changed successfully!" })
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" })
      setIsChangingPassword(false)
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage({ type: "error", text: "Failed to change password. Please try again." })
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <div className="flex items-center gap-3">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
            <Plus className="w-4 h-4 mr-2" />
            Add Farm
          </Button>
          <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center">
            <span className="text-lg">👨‍🌾</span>
          </div>
        </div>
      </div>

      {saveMessage && (
        <Alert variant={saveMessage.type === "success" ? "default" : "destructive"} className="mb-6">
          <div className="flex items-center gap-2">
            {saveMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{saveMessage.text}</AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card - Left */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                <span className="text-5xl">👨‍🌾</span>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">{formData.name || "Farmer"}</h2>
              <div className="flex items-center gap-1 text-muted-foreground mb-6">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {formData.district}, {formData.state}
                </span>
              </div>

              <div className="flex items-center justify-center gap-8 w-full py-4 border-t border-b border-border">
                {profileStats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Member since January 2024</span>
              </div>

              <Button
                variant="outline"
                className="mt-6 rounded-full"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditMode ? "Cancel" : "Edit Profile"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                {isEditMode ? (
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="rounded-lg"
                  />
                ) : (
                  <p className="text-foreground">{formData.name || "—"}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                {isEditMode ? (
                  <Input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-lg"
                  />
                ) : (
                  <p className="text-foreground">{formData.email || "—"}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                {isEditMode ? (
                  <Input
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="rounded-lg"
                    disabled
                  />
                ) : (
                  <p className="text-foreground">{formData.phone || "—"}</p>
                )}
              </div>

              {/* Language Preference */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Language Preference</label>
                {isEditMode ? (
                  <Select
                    value={formData.preferred_language || "en"}
                    onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LANGUAGES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground">{LANGUAGES[formData.preferred_language as keyof typeof LANGUAGES] || "English"}</p>
                )}
              </div>

              {isEditMode && (
                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full rounded-lg">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Profile Changes"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isChangingPassword ? (
                <Button
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={() => setIsChangingPassword(true)}
                >
                  Change Password
                </Button>
              ) : (
                <>
                  {/* Old Password */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
                    <div className="relative">
                      <Input
                        type={showPasswords ? "text" : "password"}
                        value={passwordData.oldPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, oldPassword: e.target.value })
                        }
                        placeholder="Enter current password"
                        className="rounded-lg pr-10"
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPasswords(!showPasswords)}
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                    <div className="relative">
                      <Input
                        type={showPasswords ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        placeholder="Enter new password"
                        className="rounded-lg pr-10"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
                    <div className="relative">
                      <Input
                        type={showPasswords ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        placeholder="Confirm new password"
                        className="rounded-lg pr-10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-lg"
                      onClick={() => {
                        setIsChangingPassword(false)
                        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      disabled={isSaving}
                      className="flex-1 rounded-lg"
                    >
                      {isSaving ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* My Farms */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">My Farms</CardTitle>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Manage <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {farms.map((farm) => (
                <div
                  key={farm.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">🌾</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{farm.farm_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {farm.area_hectares} ha · {farm.crop_name}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 rounded-full">
                    {farm.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
