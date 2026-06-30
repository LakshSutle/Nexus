"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertCircle, CheckCircle, Plus, Activity, Search,
  TrendingUp, TrendingDown, Clock, ArrowRight, Zap,
  Calendar, RefreshCw, Sliders, Loader2
} from "lucide-react"
import { createClient } from "@/lib/supabase"
import { api } from "@/lib/api"
import dynamic from "next/dynamic"

const HealthChart = dynamic(() => import("@/components/dashboard/health-chart"), {
  ssr: false,
  loading: () => <div className="h-40 w-full animate-pulse bg-white/5 rounded-xl border border-white/[0.04]" />
})

import { AgentOrchestration } from "@/components/dashboard/agent-orchestration"
import { AgentActivityFeed } from "@/components/dashboard/agent-activity-feed"
import { DemoWalkthrough } from "@/components/dashboard/demo-walkthrough"
import { ReminderChannels } from "@/components/dashboard/reminder-channels"
import { ToastNotification, type ToastData } from "@/components/ui/toast-notification"

interface Goal {
  id: string
  title: string
  deadline: string
  failure_probability: number
  execution_health_score: number
  status: string
  description?: string
}

interface HealthData {
  health_score: number
  failure_probability: number
  tasks_completed: number
  tasks_remaining: number
  days_remaining: number
  projected_completion?: string
  velocity_actual?: number
  velocity_required?: number
}

interface Intervention {
  id: string
  goal_id: string
  status: string
  failure_probability: number
  goals?: { title: string }
}

export default function DashboardPage() {
  const [healthScore, setHealthScore] = useState(0)
  const [targetHealth, setTargetHealth] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [healthData, setHealthData] = useState<Record<string, HealthData>>({})
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [user, setUser] = useState<any>(null)
  const [toast, setToast] = useState<string | ToastData | null>(null)
  const dismissToast = useCallback(() => setToast(null), [])
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({})
  const [syncingCalendar, setSyncingCalendar] = useState(false)
  const [healthHistory, setHealthHistory] = useState<any[]>([])
  const [showActivityFeed, setShowActivityFeed] = useState(false)

  const handleSyncCalendar = async () => {
    if (!user) return
    setSyncingCalendar(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const providerToken = session?.provider_token
      if (!providerToken) {
        setToast("⚠️ Please sign in with Google to sync calendar")
        setTimeout(() => setToast(null), 3000)
        return
      }

      const res = await api.syncGoalsFromCalendar(providerToken, user.id)
      if (res.success) {
        setToast(`✅ Calendar sync complete! Imported ${res.imported_count} new goals`)
        setTimeout(() => setToast(null), 4000)

        // Reload goals and data
        const goalsRes = await api.getGoals(user.id)
        if (goalsRes.goals) {
          setGoals(goalsRes.goals)
          const healthPromises = goalsRes.goals.map(async (goal: Goal) => {
            try {
              const healthRes = await api.getGoalHealth(goal.id)
              return { [goal.id]: healthRes }
            } catch {
              return { [goal.id]: {} }
            }
          })
          const healthResults = await Promise.all(healthPromises)
          setHealthData(Object.assign({}, ...healthResults))

          const avgHealth = goalsRes.goals.reduce((sum: number, g: Goal) =>
            sum + g.execution_health_score, 0) / goalsRes.goals.length
          setTargetHealth(Math.round(avgHealth || 0))
        }
      }
    } catch (err) {
      console.error("Calendar sync failed:", err)
      setToast("❌ Calendar sync failed")
      setTimeout(() => setToast(null), 3000)
    } finally {
      setSyncingCalendar(false)
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          window.location.href = "/login"
          return
        }

        setUser(user)

        // Try to auto-sync manual Google Calendar goals on mount
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const providerToken = session?.provider_token
          if (providerToken) {
            console.log("Auto-syncing manual Google Calendar goals...")
            await api.syncGoalsFromCalendar(providerToken, user.id)
          }
        } catch (syncErr) {
          console.error("Auto goals sync failed:", syncErr)
        }

        // Fetch goals
        const goalsRes = await api.getGoals(user.id)
        if (goalsRes.goals) {
          setGoals(goalsRes.goals)

          // Fetch health data for each goal
          const healthPromises = goalsRes.goals.map(async (goal: Goal) => {
            try {
              const healthRes = await api.getGoalHealth(goal.id)
              return { [goal.id]: healthRes }
            } catch {
              return { [goal.id]: {} }
            }
          })
          const healthResults = await Promise.all(healthPromises)
          setHealthData(Object.assign({}, ...healthResults))

          // Set overall health score
          const avgHealth = goalsRes.goals.reduce((sum: number, g: Goal) =>
            sum + g.execution_health_score, 0) / goalsRes.goals.length
          setTargetHealth(Math.round(avgHealth || 0))

          // Fetch health history for first goal (for chart)
          if (goalsRes.goals.length > 0) {
            try {
              const historyRes = await api.getHealthHistory(goalsRes.goals[0].id)
              if (historyRes.snapshots) {
                setHealthHistory(historyRes.snapshots.map((s: any) => ({
                  date: new Date(s.snapshot_date).toLocaleDateString("en", { month: "short", day: "numeric" }),
                  health: s.health_score,
                  velocity: s.velocity_actual
                })))
              }
            } catch {
              // Chart data is non-critical
            }
          }
        }

        // Fetch interventions
        const interventionsRes = await api.getInterventions(user.id)
        if (interventionsRes.interventions) {
          setInterventions(interventionsRes.interventions)
        }

      } catch (err) {
        console.error("Failed to load dashboard data:", err)
        setError("Could not connect to AI backend. Some features may be unavailable.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Animate health score up or down
  useEffect(() => {
    if (!loading && targetHealth > 0) {
      const interval = setInterval(() => {
        setHealthScore((prev) => {
          if (prev < targetHealth) return prev + 1
          if (prev > targetHealth) return prev - 1
          clearInterval(interval)
          return targetHealth
        })
      }, 20)
      return () => clearInterval(interval)
    }
  }, [loading, targetHealth])

  const getHealthColor = (score: number) => {
    if (score > 79) return "#22c55e"
    if (score > 49) return "#eab308"
    return "#ef4444"
  }

  const getRiskColor = (risk: number) => {
    if (risk < 40) return "glow-pill-green text-green-400"
    if (risk < 70) return "glow-pill-yellow text-yellow-400"
    return "glow-pill-red text-red-400"
  }

  const analyzeGoal = async (goalId: string) => {
    setAnalyzing(prev => ({ ...prev, [goalId]: true }))
    try {
      await api.analyzeGoal(goalId)

      // Refresh data
      if (user) {
        const [goalsRes, interventionsRes] = await Promise.all([
          api.getGoals(user.id),
          api.getInterventions(user.id)
        ])

        if (goalsRes.goals) {
          setGoals(goalsRes.goals)
          const healthPromises = goalsRes.goals.map(async (goal: Goal) => {
            try {
              const healthRes = await api.getGoalHealth(goal.id)
              return { [goal.id]: healthRes }
            } catch {
              return { [goal.id]: {} }
            }
          })
          const healthResults = await Promise.all(healthPromises)
          setHealthData(Object.assign({}, ...healthResults))

          const avgHealth = goalsRes.goals.reduce((sum: number, g: Goal) =>
            sum + g.execution_health_score, 0) / goalsRes.goals.length
          setTargetHealth(Math.round(avgHealth || 0))
        }

        if (interventionsRes.interventions) {
          setInterventions(interventionsRes.interventions)
        }
      }

      setToast("✅ Analysis complete — agents ran successfully")
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      console.error("Analysis failed:", err)
      setToast("❌ Analysis failed")
      setTimeout(() => setToast(null), 3000)
    } finally {
      setAnalyzing(prev => ({ ...prev, [goalId]: false }))
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  // Aggregate stats
  const totalCompleted = Object.values(healthData).reduce((sum, h) => sum + (h.tasks_completed || 0), 0)
  const totalRemaining = Object.values(healthData).reduce((sum, h) => sum + (h.tasks_remaining || 0), 0)
  const pendingInterventions = interventions.filter(i => i.status === "pending")
  const isAnyGoalAnalyzing = Object.values(analyzing).some(v => v === true)
  const activeGoalId = Object.keys(analyzing).find(k => analyzing[k] === true)
  const activeGoalTitle = goals.find(g => g.id === activeGoalId)?.title

  // Compute values for AgentOrchestration & StreamingTerminal
  const currentGoal = goals.find(g => g.id === (activeGoalId || goals[0]?.id))
  const currentHealth = currentGoal ? healthData[currentGoal.id] : undefined
  const currentTotal = currentHealth ? ((currentHealth.tasks_completed || 0) + (currentHealth.tasks_remaining || 0)) : 0
  const progressPct = currentTotal > 0
    ? Math.round(((currentHealth?.tasks_completed || 0) / currentTotal) * 100)
    : 0
  let daysBehind = 0
  if (currentGoal && currentHealth?.projected_completion) {
    const proj = new Date(currentHealth.projected_completion).getTime()
    const dead = new Date(currentGoal.deadline).getTime()
    if (proj > dead) {
      daysBehind = Math.ceil((proj - dead) / (1000 * 60 * 60 * 24))
    }
  }

  const goalAccentColors = [
    { gradient: 'from-[oklch(0.65_0.28_285)] to-[oklch(0.75_0.18_195)]', text: 'text-[oklch(0.65_0.28_285)]', bg: 'bg-[oklch(0.65_0.28_285)]' },
    { gradient: 'from-[oklch(0.75_0.18_195)] to-[oklch(0.72_0.19_155)]', text: 'text-[oklch(0.75_0.18_195)]', bg: 'bg-[oklch(0.75_0.18_195)]' },
    { gradient: 'from-[oklch(0.72_0.19_155)] to-[oklch(0.78_0.16_75)]', text: 'text-[oklch(0.72_0.19_155)]', bg: 'bg-[oklch(0.72_0.19_155)]' },
    { gradient: 'from-[oklch(0.78_0.16_75)] to-[oklch(0.65_0.22_25)]', text: 'text-[oklch(0.78_0.16_75)]', bg: 'bg-[oklch(0.78_0.16_75)]' },
    { gradient: 'from-[oklch(0.65_0.22_25)] to-[oklch(0.6_0.24_340)]', text: 'text-[oklch(0.65_0.22_25)]', bg: 'bg-[oklch(0.65_0.22_25)]' },
  ]

  return (
    <div className="p-6 md:p-8">
      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 px-4 py-3 rounded-xl flex items-center gap-2 mb-8 backdrop-blur-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-6 shimmer">
                <div className="h-32 bg-primary/5 rounded-full mx-auto mb-4" />
                <div className="h-4 bg-primary/5 rounded w-24 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : goals.length === 0 ? (
        /* Empty State */
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="glass-card rounded-2xl p-10 text-center max-w-md relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="w-20 h-20 bg-gradient-to-br from-primary/15 to-[oklch(0.75_0.18_195_/_15%)] rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-[0_0_30px_-8px_var(--glow)]">
              <Zap className="w-9 h-9 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gradient-primary">Welcome to NEXUS</h2>
            <p className="text-muted-foreground mb-8">
              Create your first goal and our 9 AI agents will build your execution plan.
            </p>
            <a
              href="/goals/new"
              className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 inline-flex items-center gap-2 shadow-[0_8px_30px_-4px_var(--glow)]"
            >
              <Plus className="w-4 h-4" />
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
          {/* Main Content Column */}
          <div className={`${showActivityFeed ? "xl:col-span-3" : "xl:col-span-4"} space-y-8`}>
            {/* SECTION 0 - Agent Orchestration Neural Network & Terminal (First priority for demo) */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              <AgentOrchestration
                isAnalyzing={isAnyGoalAnalyzing}
                activeGoalTitle={activeGoalTitle || currentGoal?.title}
                activeGoalId={activeGoalId || currentGoal?.id}
                goalDescription={currentGoal?.description}
                deadline={currentGoal?.deadline}
                completionPct={progressPct}
                daysBehind={daysBehind}
              />
            </motion.div>

            {/* SECTION 1 - Top Stats Row */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
            {/* Card 1: Execution Health Score */}
            <motion.div id="demo-health-card" variants={item} className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="absolute inset-0 card-grid-overlay pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-[oklch(0.75_0.18_195_/_30%)] to-transparent" />
              <div className="flex flex-col items-center relative z-10">
                <div className="relative w-32 h-32 overflow-visible">
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/10 to-[oklch(0.75_0.18_195_/_10%)] blur-md opacity-50" />
                  <svg className="w-32 h-32 transform -rotate-90 overflow-visible relative z-10">
                    <defs>
                      <linearGradient id="health-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="oklch(0.65 0.28 285)" />
                        <stop offset="50%" stopColor="oklch(0.75 0.18 195)" />
                        <stop offset="100%" stopColor={getHealthColor(healthScore)} />
                      </linearGradient>
                      <filter id="health-glow" x="-25%" y="-25%" width="150%" height="150%">
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={getHealthColor(healthScore)} floodOpacity="0.5" />
                      </filter>
                    </defs>
                    <circle cx="64" cy="64" r="56" stroke="currentColor"
                      className="text-primary/[0.06]"
                      strokeWidth="8" fill="none" />
                    <motion.circle cx="64" cy="64" r="56"
                      stroke="url(#health-gradient)"
                      strokeWidth="8" fill="none" strokeLinecap="round"
                      filter="url(#health-glow)"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: healthScore / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      style={{ strokeDasharray: "351.86", strokeDashoffset: "0" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <span className="text-3xl font-extrabold tracking-tight text-gradient-aurora drop-shadow-[0_2px_8px_var(--glow)]">{healthScore}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Score</span>
                  </div>
                </div>
                <p className="mt-4 text-sm font-bold text-foreground/90">Execution Health</p>
                <div className="flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-primary/[0.04] border border-primary/[0.08] text-[11px]">
                  {healthScore > 70 ? (
                    <>
                      <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-green-400 font-semibold">On track</span>
                    </>
                  ) : (
                    <>
                      <span className="size-1.5 rounded-full bg-yellow-500 animate-pulse" />
                      <span className="text-yellow-400 font-semibold">Needs attention</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Card 2: Active Alert / All Clear */}
            <motion.div id="demo-intervention-card" variants={item} className={`rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px] ${pendingInterventions.length > 0 ? 'crimson-glass border-red-500/25' : 'glass-card border-primary/[0.06]'}`}>
              {pendingInterventions.length > 0 ? (
                <div className="h-full flex flex-col justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">Risk Detected</h3>
                    </div>
                    <p className="text-sm font-semibold text-foreground/90 truncate mb-1">
                      {pendingInterventions[0]?.goals?.title || "Unknown Goal"}
                    </p>
                    <p className="text-2xl font-extrabold text-gradient-risk mb-4">
                      {Math.round((pendingInterventions[0]?.failure_probability || 0) * 100)}% failure risk
                    </p>
                  </div>
                  <a
                    href="/interventions"
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/35 hover:border-red-500/60 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 inline-flex items-center justify-center gap-2 w-full shadow-[0_0_15px_rgba(239,68,68,0.05)] cursor-pointer"
                  >
                    <AlertCircle className="w-4 h-4" />
                    View Rescue Plan
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/15 to-green-500/5 flex items-center justify-center mb-3 border border-green-500/20 shadow-[0_0_20px_-4px_rgba(34,197,94,0.15)]">
                    <CheckCircle className="w-7 h-7 text-green-400" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">All Clear</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">
                    No active risks. 9 agents monitoring goals.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Card 3: Quick Stats */}
            <motion.div variants={item} className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="absolute inset-0 card-grid-overlay pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[oklch(0.75_0.18_195_/_40%)] to-transparent" />
              <div className="space-y-3.5 relative z-10 w-full">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Active goals</span>
                  <span className="font-bold text-foreground bg-primary/[0.06] border border-primary/[0.1] px-2.5 py-0.5 rounded-lg">{goals.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Tasks completed</span>
                  <span className="font-bold text-green-400 bg-green-500/8 border border-green-500/15 px-2.5 py-0.5 rounded-lg">{totalCompleted}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Tasks remaining</span>
                  <span className="font-bold text-foreground bg-primary/[0.06] border border-primary/[0.1] px-2.5 py-0.5 rounded-lg">{totalRemaining}</span>
                </div>
                <div className="space-y-2 pt-3 w-full">
                  <div className="h-1.5 bg-primary/[0.04] rounded-full overflow-hidden border border-primary/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${totalCompleted + totalRemaining > 0 ? (totalCompleted / (totalCompleted + totalRemaining)) * 100 : 0}%`
                      }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-primary to-[oklch(0.75_0.18_195)] rounded-full shadow-[0_0_12px_var(--glow)]"
                    />
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider font-bold">
                    {totalCompleted + totalRemaining > 0
                      ? `${Math.round((totalCompleted / (totalCompleted + totalRemaining)) * 100)}% overall completion`
                      : "No tasks yet"}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* SECTION 2 - Chart and Reminders Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <motion.div
              id="demo-chart-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 glass-card rounded-2xl p-6"
            >
              <h2 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider">
                Health Score Trend
              </h2>
              <HealthChart data={healthHistory.length > 1 ? healthHistory : [
                { date: "Jun 20", health: 40, velocity: 0.8 },
                { date: "Jun 21", health: 45, velocity: 0.9 },
                { date: "Jun 22", health: 50, velocity: 1.0 },
                { date: "Jun 23", health: 52, velocity: 1.1 },
                { date: "Jun 24", health: 58, velocity: 1.2 },
                { date: "Jun 25", health: 65, velocity: 1.25 },
                { date: "Jun 26", health: 68, velocity: 1.28 }
              ]} />
            </motion.div>

            <motion.div
              id="demo-reminders-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="lg:col-span-1"
            >
              <ReminderChannels onTriggerTestAlert={(data) => {
                setToast(data)
              }} />
            </motion.div>
          </div>

          {/* SECTION 3 - Goals Grid */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold tracking-tight text-gradient-primary">Your Goals</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowActivityFeed(!showActivityFeed)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-300 cursor-pointer ${
                    showActivityFeed
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_4px_12px_var(--glow)]"
                      : "bg-primary/5 text-foreground/70 hover:text-foreground border-primary/10 hover:border-primary/20"
                  }`}
                  title="Toggle Agent Activity Feed"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Activity Feed</span>
                </button>
                <button
                  onClick={handleSyncCalendar}
                  disabled={syncingCalendar}
                  className="flex items-center gap-2 bg-primary/5 text-foreground/70 hover:text-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/10 border border-primary/10 hover:border-primary/20 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncingCalendar ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  {syncingCalendar ? "Syncing..." : "Sync Calendar"}
                </button>
                <a
                  href="/goals/new"
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all duration-300 shadow-[0_4px_20px_-4px_var(--glow)] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  New Goal
                </a>
              </div>
            </div>

            <div id="demo-goals-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((goal, index) => {
                const health = healthData[goal.id]
                const goalTotal = health ? ((health.tasks_completed || 0) + (health.tasks_remaining || 0)) : 0
                const progress = goalTotal > 0
                  ? Math.round(((health?.tasks_completed || 0) / goalTotal) * 100)
                  : 0
                const daysRemaining = health?.days_remaining || 0
                const risk = goal.failure_probability * 100
                const projectedCompletion = health?.projected_completion
                const accent = goalAccentColors[index % goalAccentColors.length]

                return (
                  <motion.div
                    key={goal.id}
                    variants={item}
                    onClick={(e) => {
                      const target = e.target as HTMLElement
                      if (!target.closest('button')) {
                        window.location.href = `/goals/${goal.id}/timeline`
                      }
                    }}
                    className="glass-card rounded-2xl p-6 cursor-pointer relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 card-grid-overlay pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
                    {/* Unique gradient accent stripe */}
                    <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${accent.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-300">
                        {goal.title}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRiskColor(risk)}`}>
                        {Math.round(risk)}% risk
                      </span>
                    </div>

                    <div className="mb-4 relative z-10">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-bold text-foreground/90">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-primary/[0.04] rounded-full overflow-hidden border border-primary/[0.06]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                          className={`h-full bg-gradient-to-r ${accent.gradient} rounded-full shadow-[0_0_10px_var(--glow)]`}
                        />
                      </div>
                    </div>

                    {/* Projected completion */}
                    {projectedCompletion && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 bg-primary/[0.03] border border-primary/[0.06] rounded-xl px-3 py-2">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>
                          At current pace → finishes {new Date(projectedCompletion).toLocaleDateString("en", { month: "short", day: "numeric" })}
                          {daysRemaining > 0 && new Date(projectedCompletion) > new Date(goal.deadline) && (
                            <span className="text-red-400 font-semibold ml-1">
                              ({Math.ceil((new Date(projectedCompletion).getTime() - new Date(goal.deadline).getTime()) / 86400000)}d late)
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-primary/[0.06]">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {daysRemaining}d remaining
                      </span>
                      <button
                        disabled={analyzing[goal.id]}
                        className="flex items-center gap-1.5 text-primary bg-primary/5 hover:bg-primary/10 border border-primary/15 hover:border-primary/30 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {analyzing[goal.id] ? (
                          <span className="flex items-center gap-1.5">
                            <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                            Analyzing...
                          </span>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5" />
                            Analyze
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
          </div>

          {/* Sidebar Column */}
          {showActivityFeed && (
            <div className="xl:col-span-1 space-y-6">
              <AgentActivityFeed userId={user?.id} />
              <AgentActivityFeed userId={user?.id} />
            </div>
          )}
        </div>
      )}

      <DemoWalkthrough />

      {/* Toast Notification */}
      <ToastNotification toast={toast} onDismiss={dismissToast} />
    </div>
  )
}
