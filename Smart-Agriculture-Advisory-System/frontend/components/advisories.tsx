"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertCircle, Calendar, Plus, ThumbsDown, ThumbsUp, Leaf } from "lucide-react"
import { useAdvisories } from "@/lib/api-client"
import type { Advisory } from "@/lib/types"

export function Advisories() {
  const [page, setPage] = useState(0)
  const [selectedAdvisory, setSelectedAdvisory] = useState<Advisory | null>(null)
  
  const pageSize = 10
  const { data: advisories = [], isLoading, isError } = useAdvisories(pageSize, page * pageSize)

  const filteredAdvisories = useMemo(() => Array.isArray(advisories) ? [...advisories].sort((a, b) => new Date(b.generated_at || "").getTime() - new Date(a.generated_at || "").getTime()) : [], [advisories])

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center pt-8 pb-4">
        <h1 className="font-heading text-4xl lg:text-5xl font-extrabold text-[#0B3D2E] tracking-tight">
          Field Intelligence
        </h1>
        <p className="text-[#6b7280] font-medium mt-3 text-lg max-w-xl mx-auto">
          Contextual advisories generated from live sensor arrays and historical agronomy patterns.
        </p>
      </div>

      {/* ── Summary Floating Banner ─────────────────────────── */}
      <div className="bg-[#355ca8] text-white rounded-[2rem] shadow-xl shadow-[#355ca8]/20 p-8 flex flex-col md:flex-row items-center justify-between z-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-white/80 font-medium tracking-wide uppercase text-sm mb-1">Active Alerts</p>
            <h2 className="font-heading text-4xl font-black">{filteredAdvisories.length} signals</h2>
          </div>
        </div>
        <Button className="mt-6 md:mt-0 bg-white text-[#355ca8] hover:bg-[#f9f9f9] rounded-full px-8 py-6 font-bold shadow-lg transition-transform hover:scale-105">
          <Plus className="w-5 h-5 mr-2" /> Download Report
        </Button>
      </div>

      {/* ── Advisories List (Overlapping Stack) ─────────────── */}
      <div className="flex flex-col -mt-6">
        {isError && (
          <div className="p-6 rounded-[2rem] bg-[#da3633]/10 text-[#da3633] text-center font-bold">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" /> Failed to load intelligence feed.
          </div>
        )}
        
        {isLoading && (
          <div className="space-y-4 pt-12">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-black/5 rounded-[2rem] animate-pulse" />)}
          </div>
        )}

        {!isLoading && !isError && filteredAdvisories.map((advisory, idx) => {
          // Determine aesthetics based on severity
          const isHigh = advisory.severity === "high"
          const isLow = advisory.severity === "low"
          const bgClass = isHigh ? "bg-[#da3633]/5 shadow-[#da3633]/5" : isLow ? "bg-[#89ADFF]/10 shadow-[#89ADFF]/5" : "bg-white shadow-black/5"
          const titleColor = isHigh ? "text-[#da3633]" : "text-[#0B3D2E]"
          const overlapClass = idx > 0 ? "-mt-4" : "mt-8"
          
          return (
            <Card
              key={advisory.id}
              onClick={() => setSelectedAdvisory(advisory)}
              className={`relative ${overlapClass} ${bgClass} border-0 shadow-xl rounded-[2rem] z-${20 - idx} transition-all duration-300 hover:z-30 hover:-translate-y-2 hover:shadow-2xl cursor-pointer overflow-hidden p-8`}
              style={{ zIndex: 40 - idx }}
            >
              {isHigh && <div className="absolute top-0 left-0 w-2 h-full bg-[#da3633]" />}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className={`rounded-full px-3 py-1 font-bold border-0 ${isHigh ? "bg-[#da3633] text-white" : isLow ? "bg-[#89ADFF] text-[#1a1c1c]" : "bg-[#FFB000] text-[#1a1c1c]"}`}>
                      {advisory.severity.toUpperCase()} Priority
                    </Badge>
                    <span className="text-[#6b7280] text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {new Date(advisory.generated_at || "").toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className={`font-heading text-2xl font-black mb-3 capitalize ${titleColor}`}>
                    {advisory.advisory_type.replace(/_/g, " ")}
                  </h3>
                  
                  <p className="text-[#1a1c1c]/80 font-medium leading-relaxed max-w-2xl">
                    {advisory.message}
                  </p>
                </div>
                
                {/* Confidence Bubble */}
                {advisory.confidence && (
                  <div className="flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-full bg-white shadow-lg border border-[#e5e5e5]/50">
                    <span className="font-heading text-2xl font-black text-[#355ca8]">
                      {(advisory.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#6b7280]">Confidence</span>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Advisory Detail Modal */}
      <Dialog open={!!selectedAdvisory} onOpenChange={(open) => !open && setSelectedAdvisory(null)}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-0 rounded-[2.5rem] shadow-2xl">
          <div className="p-8 bg-[#f9f9f9]">
            <DialogHeader className="mb-6">
              <Badge className="w-fit mb-3 bg-[#355ca8]/10 text-[#355ca8] border-0 rounded-full px-4">{selectedAdvisory?.severity} severity</Badge>
              <DialogTitle className="font-heading text-3xl font-black text-[#0B3D2E] capitalize">
                {selectedAdvisory?.advisory_type?.replace(/_/g, " ")}
              </DialogTitle>
              <DialogDescription className="text-base font-medium text-[#6b7280] mt-2">
                Generated {new Date(selectedAdvisory?.generated_at || "").toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            <div className="text-lg leading-relaxed text-[#1a1c1c] font-medium mb-8 bg-white p-6 rounded-[1.5rem] shadow-sm">
              {selectedAdvisory?.message}
            </div>
            
            <div className="flex flex-col justify-end gap-3 pt-6 border-t border-[#e5e5e5]">
              <p className="font-bold text-center text-sm text-[#6b7280] uppercase tracking-wide mb-2">Was this insight valuable?</p>
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" className="rounded-full px-8 py-6 font-bold shadow-sm" onClick={() => setSelectedAdvisory(null)}>
                  <ThumbsDown className="w-5 h-5 mr-2 text-[#da3633]" /> Not Helpful
                </Button>
                <Button className="rounded-full bg-[#0B3D2E] text-white hover:bg-[#082b20] px-8 py-6 font-bold shadow-lg" onClick={() => setSelectedAdvisory(null)}>
                  <ThumbsUp className="w-5 h-5 mr-2" /> Yes, Actionable
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
