"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Brain,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Beaker,
    Thermometer,
    Droplets,
    CloudRain,
    FlaskConical,
    Sparkles,
} from "lucide-react"
import { usePredictCrop, useModelStatus, useTriggerRetraining } from "@/lib/api-client"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/use-toast"
import type { CropPredictRequest, CropPredictResponse } from "@/lib/types"

const defaultValues: CropPredictRequest = {
    N: 90,
    P: 42,
    K: 43,
    temperature: 21,
    humidity: 82,
    ph: 6.5,
    rainfall: 202,
}

const parameterConfig = [
    { key: "N", label: "Nitrogen (N)", unit: "kg/ha", icon: Beaker, min: 0, max: 200, step: 1, color: "text-[#355ca8]" },
    { key: "P", label: "Phosphorus (P)", unit: "kg/ha", icon: FlaskConical, min: 0, max: 200, step: 1, color: "text-[#89ADFF]" },
    { key: "K", label: "Potassium (K)", unit: "kg/ha", icon: Beaker, min: 0, max: 250, step: 1, color: "text-[#396756]" },
    { key: "temperature", label: "Temperature", unit: "°C", icon: Thermometer, min: 0, max: 55, step: 0.5, color: "text-[#FFB000]" },
    { key: "humidity", label: "Humidity", unit: "%", icon: Droplets, min: 0, max: 100, step: 1, color: "text-[#89ADFF]" },
    { key: "ph", label: "Soil pH", unit: "", icon: FlaskConical, min: 0, max: 14, step: 0.1, color: "text-[#da3633]" },
    { key: "rainfall", label: "Rainfall", unit: "mm", icon: CloudRain, min: 0, max: 500, step: 1, color: "text-[#355ca8]" },
] as const

export function MLPredict() {
    const [params, setParams] = useState<CropPredictRequest>({ ...defaultValues })
    const [result, setResult] = useState<CropPredictResponse | null>(null)

    const { data: modelStatusData, isLoading: statusLoading } = useModelStatus({ refetchInterval: 5000 } as any)
    const modelStatus = modelStatusData as any
    const queryClient = useQueryClient()
    const { toast } = useToast()

    const retrainMutation = useTriggerRetraining({
        onSuccess: () => {
             toast({ title: "Retraining Triggered", description: "The AI brain is training in the background." })
             queryClient.invalidateQueries({ queryKey: ["model-status"] })
        },
        onError: (err: any) => toast({ title: "Retraining Failed", description: err.message, variant: "destructive" })
    } as any)

    const handleRetrain = () => retrainMutation.mutate()

    const predictMutation = usePredictCrop({
        onSuccess: (data: CropPredictResponse) => setResult(data),
    } as any)

    const handlePredict = () => {
        setResult(null)
        predictMutation.mutate(params as any)
    }

    const updateParam = (key: string, value: string) => {
        const numValue = parseFloat(value)
        if (!isNaN(numValue)) setParams((prev) => ({ ...prev, [key]: numValue }))
    }

    const shapEntries = result?.shap_explanation ? Object.entries(result.shap_explanation).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a)) : []
    const maxShap = shapEntries.length > 0 ? Math.max(...shapEntries.map(([, v]) => Math.abs(v))) : 1

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="text-center pt-8 pb-2">
                <div className="w-20 h-20 rounded-full bg-[#0B3D2E] text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#0B3D2E]/30">
                  <Brain className="w-10 h-10" />
                </div>
                <h1 className="font-heading text-4xl lg:text-5xl font-extrabold text-[#0B3D2E] tracking-tight">
                    Machine Learning Prediction
                </h1>
                <p className="text-[#6b7280] font-medium mt-3 text-lg max-w-2xl mx-auto">
                    Configure soil and climate telemetry to allow the Random Forest engine to formulate an optimal crop strategy.
                </p>
            </div>

            {/* Model Status Pill */}
            {modelStatus && (
                <div className="bg-white rounded-full shadow-lg shadow-black/5 px-6 py-4 flex flex-col md:flex-row items-center justify-between border-0 mx-auto w-full max-w-3xl">
                    <div className="flex items-center gap-3">
                        {modelStatus.model_available ? (
                            <>
                                <div className="w-3 h-3 rounded-full bg-[#396756] animate-pulse" />
                                <span className="text-[#396756] font-extrabold tracking-wide">MODEL ONLINE</span>
                                <span className="text-[#1a1c1c]/40 hidden sm:inline">|</span>
                                <span className="text-[#6b7280] font-medium hidden sm:inline">{((modelStatus.accuracy || 0) * 100).toFixed(1)}% Accuracy</span>
                                <Badge className="bg-[#f3f3f3] text-[#1a1c1c] border-0 rounded-full">{modelStatus.n_classes} yields</Badge>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-5 h-5 text-[#FFB000]" />
                                <span className="text-[#FFB000] font-bold">Model requires initial training data.</span>
                            </>
                        )}
                    </div>
                    <Button 
                        onClick={handleRetrain} 
                        disabled={retrainMutation.isPending}
                        className="mt-4 md:mt-0 rounded-full bg-[#f3f3f3] text-[#1a1c1c] hover:bg-[#e5e5e5] font-bold px-6 shadow-none"
                    >
                        {retrainMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                        Trigger Sync
                    </Button>
                </div>
            )}

            {/* ── Inputs ──────────────────────────────────────────── */}
            <Card className="rounded-[2.5rem] bg-white border-0 shadow-xl shadow-black/5 p-8 lg:p-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {parameterConfig.map((param) => {
                        const Icon = param.icon
                        return (
                            <div key={param.key} className="space-y-4">
                                <Label htmlFor={param.key} className="text-sm font-bold flex items-center gap-2 text-[#6b7280] uppercase tracking-wide">
                                    <div className={`p-2 rounded-full bg-[#f9f9f9]`}>
                                      <Icon className={`w-4 h-4 ${param.color}`} />
                                    </div>
                                    {param.label}
                                </Label>
                                <div className="relative">
                                  <Input
                                      id={param.key}
                                      type="number"
                                      value={params[param.key as keyof CropPredictRequest] ?? ""}
                                      onChange={(e) => updateParam(param.key, e.target.value)}
                                      className="h-14 bg-[#f9f9f9] border-0 rounded-2xl text-xl font-bold font-heading px-4 text-[#0B3D2E] focus-visible:ring-2 focus-visible:ring-[#355ca8]/20"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#6b7280] pointer-events-none">
                                    {param.unit}
                                  </span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
                     <Button
                         onClick={handlePredict}
                         disabled={predictMutation.isPending || !modelStatus?.model_available}
                         className="bg-[#355ca8] hover:bg-[#2a4a87] text-white rounded-full px-12 py-8 h-auto font-bold text-lg shadow-xl shadow-[#355ca8]/30 transition-transform hover:scale-105 w-full sm:w-auto"
                     >
                         {predictMutation.isPending ? <><Loader2 className="w-6 h-6 mr-3 animate-spin"/> Processing Tensor...</> : <><Sparkles className="w-6 h-6 mr-3"/> Generate Strategy</>}
                     </Button>
                     <Button variant="ghost" onClick={() => { setParams({ ...defaultValues }); setResult(null) }} className="rounded-full px-8 py-8 h-auto font-bold text-[#6b7280] hover:bg-[#f3f3f3] w-full sm:w-auto">
                        Reset Variables
                     </Button>
                </div>
            </Card>

            {/* ── Results Output ──────────────────────────────────── */}
            {result && (
                <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-8 mt-4">
                    <h2 className="font-heading text-3xl font-extrabold text-[#0B3D2E] text-center">Inference Engine Output</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {result.top_predictions.map((pred, i) => (
                            <Card key={pred.crop} className={`rounded-[2rem] border-0 p-8 ${i === 0 ? "bg-[#0B3D2E] text-white shadow-2xl shadow-[#0B3D2E]/20 scale-105 z-10" : "bg-white text-[#1a1c1c] shadow-lg shadow-black/5"}`}>
                                <Badge className={`mb-6 rounded-full px-4 py-1.5 border-0 font-bold ${i === 0 ? "bg-white/20 text-white" : "bg-[#f3f3f3] text-[#6b7280]"}`}>
                                  Rank {i + 1}
                                </Badge>
                                <h3 className="font-heading text-4xl font-black capitalize tracking-tight mb-2">{pred.crop}</h3>
                                <p className={`text-5xl font-black tracking-tighter ${i === 0 ? "text-[#FFB000]" : "text-[#355ca8]"}`}>
                                  {(pred.probability * 100).toFixed(1)}<span className="text-2xl">%</span>
                                </p>
                            </Card>
                        ))}
                    </div>

                    <Card className="rounded-[2.5rem] bg-white border-0 shadow-xl shadow-black/5 p-8 lg:p-12 mb-10">
                        <h3 className="font-heading text-2xl font-bold text-[#0B3D2E] mb-8">Feature Importance (SHAP Analysis)</h3>
                        <div className="space-y-6">
                            {shapEntries.map(([feature, impact]) => {
                                const isPositive = impact > 0
                                const width = `${(Math.abs(impact) / maxShap) * 100}%`
                                const config = parameterConfig.find((p) => p.key === feature)
                                return (
                                    <div key={feature} className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="w-32 flex items-center gap-2 font-bold text-sm text-[#6b7280] uppercase tracking-wide">
                                            {config && <config.icon className={`w-4 h-4 ${config.color}`} />}
                                            {config?.label || feature}
                                        </div>
                                        <div className="flex-1 h-3 bg-[#f3f3f3] rounded-full overflow-hidden flex origin-left">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${isPositive ? "bg-[#396756]" : "bg-[#da3633]"}`}
                                                style={{ width }}
                                            />
                                        </div>
                                        <div className={`w-20 text-right font-black ${isPositive ? "text-[#396756]" : "text-[#da3633]"}`}>
                                            {isPositive ? "+" : ""}{impact.toFixed(3)}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
