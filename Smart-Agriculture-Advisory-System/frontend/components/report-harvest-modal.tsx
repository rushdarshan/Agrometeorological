"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Beaker, Thermometer, Droplets, CloudRain, Sprout, CheckCircle2 } from "lucide-react"
import { CROPS } from "@/lib/constants"
import { useSubmitTelemetry } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"

interface ReportHarvestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  farmId?: number
  defaultCrop?: string
  weatherSummary?: any
}

export function ReportHarvestModal({ open, onOpenChange, farmId, defaultCrop, weatherSummary }: ReportHarvestModalProps) {
  const { toast } = useToast()
  
  // States mapped to the Kaggle DB features + outcome
  const [formData, setFormData] = useState({
    N: 50,
    P: 50,
    K: 50,
    ph: 6.5,
    temperature: weatherSummary?.temp_mean ?? 25.0,
    humidity: weatherSummary?.humidity ?? 70.0,
    rainfall: weatherSummary?.rainfall ?? 100.0,
    yield_tons_per_hectare: 3.5,
    crop_label: defaultCrop || "Rice",
    is_successful: true
  })

  const submitMutation = useSubmitTelemetry({
    onSuccess: () => {
      toast({
        title: "Telemetry Submitted!",
        description: "Your successful harvest data has been sent to the Machine Learning pipeline to refine future recommendations.",
      })
      onOpenChange(false)
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to inject telemetry into database.",
        variant: "destructive",
      })
    }
  })

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (!formData.crop_label) {
      toast({ title: "Incomplete", description: "Crop label is required", variant: "destructive" })
      return
    }

    submitMutation.mutate({
      farm_id: farmId,
      soil_nitrogen: formData.N,
      soil_phosphorus: formData.P,
      soil_potassium: formData.K,
      soil_ph: formData.ph,
      temperature: formData.temperature,
      humidity: formData.humidity,
      rainfall: formData.rainfall,
      crop_label: formData.crop_label,
      yield_tons_per_hectare: formData.yield_tons_per_hectare,
      is_successful: formData.is_successful
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sprout className="w-5 h-5 text-emerald-600" />
            Report Harvest Yield (Telemetry)
          </DialogTitle>
          <DialogDescription>
            Submit this data to fine-tune our global predictive models. We've automatically filled in your recent meteorological data.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
          
          {/* Soil Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
              <Beaker className="w-4 h-4"/> Soil Profile
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nitrogen (PPM)</Label>
                <Input type="number" value={formData.N} onChange={e => handleChange("N", parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Phosphorus (PPM)</Label>
                <Input type="number" value={formData.P} onChange={e => handleChange("P", parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Potassium (PPM)</Label>
                <Input type="number" value={formData.K} onChange={e => handleChange("K", parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Soil pH</Label>
                <Input type="number" step="0.1" value={formData.ph} onChange={e => handleChange("ph", parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>

          {/* Climate Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
              <Thermometer className="w-4 h-4"/> Climatic Context
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mean Temp (°C)</Label>
                <Input type="number" value={formData.temperature} onChange={e => handleChange("temperature", parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Droplets className="w-3 h-3"/> Humidity (%)</Label>
                <Input type="number" value={formData.humidity} onChange={e => handleChange("humidity", parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="flex items-center gap-1"><CloudRain className="w-3 h-3"/> Season Rainfall (mm)</Label>
                <Input type="number" value={formData.rainfall} onChange={e => handleChange("rainfall", parseFloat(e.target.value) || 0)} />
                <span className="text-xs text-muted-foreground block">Extrapolated from historical average + recent 7D activity</span>
              </div>
            </div>
          </div>

          {/* Outcome Section */}
          <div className="col-span-1 md:col-span-2 mt-4 space-y-4 p-4 bg-muted/30 rounded-lg border">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
               Yield Outcome
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label>Crop Label</Label>
                <Select value={formData.crop_label} onValueChange={v => handleChange("crop_label", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CROPS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label>Yield (Tons/ha)</Label>
                <Input type="number" step="0.1" value={formData.yield_tons_per_hectare} onChange={e => handleChange("yield_tons_per_hectare", parseFloat(e.target.value))} />
              </div>

              <div className="space-y-2 col-span-2 md:col-span-2 flex items-center justify-end h-10 gap-2 mb-1">
                <Label htmlFor="success_flag">Considered Successful Harvest?</Label>
                <Switch 
                  id="success_flag" 
                  checked={formData.is_successful} 
                  onCheckedChange={v => handleChange("is_successful", v)} 
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
          </div>

        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white" 
            onClick={handleSubmit} 
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Log Telemetry via React Query
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
