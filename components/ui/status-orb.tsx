"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, ShieldAlert, ShieldCheck, Activity } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { api } from "@/lib/api"

type OrbState = "healthy" | "warning" | "critical" | "analyzing"

interface StatusOrbProps {
  userId?: string
}

export function StatusOrb({ userId }: StatusOrbProps) {
  const [orbState, setOrbState] = useState<OrbState>("healthy")
  const [averageRisk, setAverageRisk] = useState(0)
  const [goalsCount, setGoalsCount] = useState(0)
  const [criticalCount, setCriticalCount] = useState(0)
  const [showTooltip, setShowTooltip] = useState(false)

  const loadStatus = async () => {
    try {
      let activeUserId = userId
      if (!activeUserId) {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        if (!data?.user) return
        activeUserId = data.user.id
      }

      const res = await api.getGoals(activeUserId)
      if (res.goals && res.goals.length > 0) {
        const goals = res.goals
        setGoalsCount(goals.length)
        
        const avg = goals.reduce((sum: number, g: any) => sum + g.failure_probability, 0) / goals.length
        setAverageRisk(Math.round(avg * 100))

        const criticals = goals.filter((g: any) => g.failure_probability >= 0.6).length
        setCriticalCount(criticals)

        // Calculate orb state
        if (criticals > 0) {
          setOrbState("critical")
        } else if (goals.some((g: any) => g.failure_probability >= 0.35)) {
          setOrbState("warning")
        } else {
          setOrbState("healthy")
        }
      }
    } catch (err: any) {
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        // Network offline or server unreachable - handle silently
      } else {
        console.error("Failed to load orb status:", err)
      }
    }
  }

  // Load status initially and poll every 30 seconds
  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getOrbColor = () => {
    switch (orbState) {
      case "critical": return "bg-red-500 text-red-500 shadow-[0_0_12px_4px_rgba(239,68,68,0.5)]"
      case "warning": return "bg-yellow-500 text-yellow-500 shadow-[0_0_12px_4px_rgba(234,179,8,0.5)]"
      case "analyzing": return "bg-blue-500 text-blue-500 shadow-[0_0_12px_4px_rgba(79,158,255,0.5)] animate-spin"
      default: return "bg-green-500 text-green-500 shadow-[0_0_12px_4px_rgba(34,197,94,0.5)]"
    }
  }

  const getOrbLabel = () => {
    switch (orbState) {
      case "critical": return "Critical Alarms Triggered"
      case "warning": return "Workspace Attention Needed"
      case "analyzing": return "Agents Analyzing Systems..."
      default: return "All Systems Optimal"
    }
  }

  return (
    <div
      className="relative z-40 select-none cursor-pointer flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => loadStatus()}
    >
      {/* Orb Pulsing Node */}
      <span className={`size-3.5 rounded-full transition-all duration-500 relative flex shrink-0 ${getOrbColor()}`}>
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
          orbState === "critical" ? "bg-red-400" : orbState === "warning" ? "bg-yellow-400" : orbState === "analyzing" ? "bg-blue-400" : "bg-green-400"
        }`} />
      </span>

      {/* Floating Glass Tooltip Panel */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-6 top-1/2 -translate-y-1/2 ml-2 w-56 bg-[#141418]/90 dark:bg-[#0c0c0f]/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl p-3.5 shadow-xl glass-card text-foreground"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/[0.04]">
              {orbState === "critical" ? (
                <ShieldAlert className="size-4 text-red-400" />
              ) : orbState === "warning" ? (
                <ShieldAlert className="size-4 text-yellow-400" />
              ) : (
                <ShieldCheck className="size-4 text-green-400" />
              )}
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                {getOrbLabel()}
              </span>
            </div>

            {/* Content summary */}
            <div className="space-y-1.5 text-[10px] text-white/50 font-semibold">
              <div className="flex justify-between">
                <span>Active Goals</span>
                <span className="text-white">{goalsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Critical Risks</span>
                <span className={criticalCount > 0 ? "text-red-400 font-bold" : "text-white"}>
                  {criticalCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Average Failure Risk</span>
                <span className={averageRisk > 50 ? "text-yellow-400" : averageRisk > 70 ? "text-red-400" : "text-green-400"}>
                  {averageRisk}%
                </span>
              </div>
            </div>
            
            <div className="text-[8px] text-white/30 text-center mt-2.5 pt-2 border-t border-white/[0.04] font-mono">
              Click to force status poll
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
