"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"
import { registerFarmer, type FarmerRegisterPayload } from "@/lib/api"

interface RegisterFarmerModalProps {
  onClose: () => void
  onSuccess?: () => void
}

const defaultForm: FarmerRegisterPayload = {
  phone: "",
  name: "",
  village: "",
  district: "Kaira",
  state: "Gujarat",
  latitude: 22.75,
  longitude: 72.68,
  crop_name: "Rice",
  area_hectares: 5,
  consented_advisory: true,
  consented_data_use: true,
  preferred_language: "en",
}

export function RegisterFarmerModal({ onClose, onSuccess }: RegisterFarmerModalProps) {
  const [form, setForm] = useState<FarmerRegisterPayload>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const set = (key: keyof FarmerRegisterPayload, value: string | number | boolean) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(""); setSuccess("")
    try {
      const result = await registerFarmer(form)
      setSuccess(`Farmer "${result.name}" registered! ID: ${result.id}`)
      setTimeout(() => { onSuccess?.(); onClose() }, 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl font-bold">Register Farmer</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Full Name",   key: "name"    as const, type: "text",  placeholder: "e.g. Ramesh Patel"     },
              { label: "Phone",       key: "phone"   as const, type: "tel",   placeholder: "+91 9876543210"         },
              { label: "Village",     key: "village" as const, type: "text",  placeholder: "Village name"           },
              { label: "District",    key: "district"as const, type: "text",  placeholder: "Kaira"                  },
              { label: "Crop",        key: "crop_name"as const,type: "text",  placeholder: "Rice / Wheat / Cotton"  },
              { label: "Area (ha)",   key: "area_hectares" as const, type: "number", placeholder: "5"               },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
                <input
                  type={type}
                  value={String(form[key] ?? "")}
                  onChange={e => set(key, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required={["name","phone","village","district","crop_name"].includes(key)}
                />
              </div>
            ))}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="consent"
                checked={form.consented_advisory}
                onChange={e => { set("consented_advisory", e.target.checked); set("consented_data_use", e.target.checked) }}
                className="rounded"
              />
              <label htmlFor="consent" className="text-sm text-muted-foreground">
                Consent to receive advisories & data use
              </label>
            </div>

            {error   && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}
            {success && <p className="text-sm text-primary bg-primary/10 p-3 rounded-lg">{success}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 rounded-full" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 rounded-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? "Registering…" : "Register"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
