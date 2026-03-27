"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useRegisterFarmer } from "@/lib/api-client"
import { FarmerRegisterSchema, type FarmerRegisterFormData } from "@/lib/validation"
import { CROPS, DISTRICTS, LANGUAGES } from "@/lib/constants"

interface RegisterFarmerModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export function RegisterFarmerModal({ onClose, onSuccess }: RegisterFarmerModalProps) {
  const [successMessage, setSuccessMessage] = useState("")
  const registerMutation = useRegisterFarmer()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FarmerRegisterFormData>({
    resolver: zodResolver(FarmerRegisterSchema),
    defaultValues: {
      phone: "91",
      state: "Gujarat",
      latitude: 22.75,
      longitude: 72.68,
      consented_advisory: false,
      consented_data_use: false,
      preferred_language: "en",
    },
  })

  const phoneValue = watch("phone")
  const consentedAdvisory = watch("consented_advisory")
  const consentedDataUse = watch("consented_data_use")
  const cropName = watch("crop_name")
  const district = watch("district")

  // Format phone number to Indian format
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (!value.startsWith("91")) {
      value = "91" + value
    }
    if (value.length > 12) {
      value = value.slice(0, 12)
    }
    setValue("phone", value)
  }

  const onSubmit = async (data: FarmerRegisterFormData) => {
    try {
      const result = await registerMutation.mutateAsync(data)
      setSuccessMessage(`✓ Farmer "${result.name}" registered successfully! ID: ${result.id}`)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Registration failed:", error)
    }
  }

  const isLoading = registerMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-4 sticky top-0 bg-card">
          <CardTitle className="text-2xl font-bold">Register New Farmer</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent>
          {successMessage ? (
            <Alert variant="default" className="mb-6">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          ) : null}

          {registerMutation.isError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription>
                {registerMutation.error instanceof Error
                  ? registerMutation.error.message
                  : "Registration failed. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("name")}
                  placeholder="e.g. Ramesh Patel"
                  className="rounded-lg"
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    +
                  </span>
                  <Input
                    type="tel"
                    value={phoneValue}
                    onChange={handlePhoneChange}
                    placeholder="91 9876543210"
                    className="rounded-lg pl-8"
                    disabled={isLoading}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Village */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Village <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("village")}
                  placeholder="Village name"
                  className="rounded-lg"
                  disabled={isLoading}
                />
                {errors.village && (
                  <p className="text-sm text-destructive mt-1">{errors.village.message}</p>
                )}
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  District <span className="text-destructive">*</span>
                </label>
                <Select
                  value={district || ""}
                  onValueChange={(value) => setValue("district", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.district && (
                  <p className="text-sm text-destructive mt-1">{errors.district.message}</p>
                )}
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  State <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("state")}
                  placeholder="Gujarat"
                  className="rounded-lg"
                  disabled
                />
                {errors.state && (
                  <p className="text-sm text-destructive mt-1">{errors.state.message}</p>
                )}
              </div>

              {/* Crop Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Primary Crop <span className="text-destructive">*</span>
                </label>
                <Select
                  value={cropName || ""}
                  onValueChange={(value) => setValue("crop_name", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select crop" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROPS.map((crop) => (
                      <SelectItem key={crop} value={crop}>
                        {crop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.crop_name && (
                  <p className="text-sm text-destructive mt-1">{errors.crop_name.message}</p>
                )}
              </div>

              {/* Area in Hectares */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Farm Area (hectares)
                </label>
                <Input
                  {...register("area_hectares", { valueAsNumber: true })}
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="5"
                  className="rounded-lg"
                  disabled={isLoading}
                />
                {errors.area_hectares && (
                  <p className="text-sm text-destructive mt-1">{errors.area_hectares.message}</p>
                )}
              </div>

              {/* Language Preference */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Preferred Language
                </label>
                <Select
                  defaultValue="en"
                  onValueChange={(value) => setValue("preferred_language", value as any)}
                  disabled={isLoading}
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
              </div>
            </div>

            {/* Latitude and Longitude - Hidden but set to defaults */}
            <input type="hidden" {...register("latitude", { valueAsNumber: true })} />
            <input type="hidden" {...register("longitude", { valueAsNumber: true })} />

            {/* Consent Checkboxes */}
            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent-advisory"
                  checked={consentedAdvisory}
                  onCheckedChange={(checked) => setValue("consented_advisory", checked as boolean)}
                  disabled={isLoading}
                />
                <label htmlFor="consent-advisory" className="text-sm text-muted-foreground cursor-pointer">
                  I consent to receive agricultural advisories via SMS, email, or app notifications
                </label>
              </div>
              {errors.consented_advisory && (
                <p className="text-sm text-destructive">{errors.consented_advisory.message}</p>
              )}

              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent-data"
                  checked={consentedDataUse}
                  onCheckedChange={(checked) => setValue("consented_data_use", checked as boolean)}
                  disabled={isLoading}
                />
                <label htmlFor="consent-data" className="text-sm text-muted-foreground cursor-pointer">
                  I consent to the collection and use of my farm data for improving advisory recommendations
                </label>
              </div>
              {errors.consented_data_use && (
                <p className="text-sm text-destructive">{errors.consented_data_use.message}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-full"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register Farmer"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
