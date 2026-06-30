"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase"
import { api } from "@/lib/api"
import { Plus, Target, Calendar, AlertTriangle, CheckCircle } from "lucide-react"

interface Goal {
  id: string
  title: string
  description: string
  deadline: string
  daily_hours_available: number
  status: string
  failure_probability: number
  execution_health_score: number
}

const goalAccentColors = [
  { gradient: 'from-[oklch(0.65_0.28_285)] to-[oklch(0.75_0.18_195)]', border: 'border-l-[oklch(0.65_0.28_285)]' },
  { gradient: 'from-[oklch(0.75_0.18_195)] to-[oklch(0.72_0.19_155)]', border: 'border-l-[oklch(0.75_0.18_195)]' },
  { gradient: 'from-[oklch(0.72_0.19_155)] to-[oklch(0.78_0.16_75)]', border: 'border-l-[oklch(0.72_0.19_155)]' },
  { gradient: 'from-[oklch(0.78_0.16_75)] to-[oklch(0.65_0.22_25)]', border: 'border-l-[oklch(0.78_0.16_75)]' },
  { gradient: 'from-[oklch(0.65_0.22_25)] to-[oklch(0.6_0.24_340)]', border: 'border-l-[oklch(0.65_0.22_25)]' },
]

export default function GoalsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadGoals() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push("/login")
          return
        }

        const res = await api.getGoals(user.id)
        if (res.goals) {
          setGoals(res.goals)
        }
      } catch (err) {
        console.error("Failed to load goals:", err)
      } finally {
        setLoading(false)
      }
    }

    loadGoals()
  }, [router])

  const getRiskColor = (risk: number) => {
    if (risk > 60) return "glow-pill-red text-red-400"
    if (risk > 30) return "glow-pill-yellow text-yellow-400"
    return "glow-pill-green text-green-400"
  }

  const getRiskLabel = (risk: number) => {
    if (risk > 60) return "High Risk"
    if (risk > 30) return "Medium Risk"
    return "On Track"
  }

  const getStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="w-5 h-5 text-green-500" />
    if (status === "paused") return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    return <Target className="w-5 h-5 text-primary" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gradient-primary mb-1.5">Your Goals</h1>
            <p className="text-muted-foreground text-sm">Manage and track your execution progress</p>
          </div>
          <a
            href="/goals/new"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-semibold shadow-[0_4px_20px_-4px_var(--glow)] hover:shadow-[0_8px_30px_-4px_var(--glow)] transition-all duration-300 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            New Goal
          </a>
        </div>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/15 to-[oklch(0.75_0.18_195_/_15%)] rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-[0_0_30px_-8px_var(--glow)]">
              <Target className="w-9 h-9 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gradient-primary mb-2">No goals yet</h2>
            <p className="text-muted-foreground mb-8 text-sm">Create your first goal to get started</p>
            <a
              href="/goals/new"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded-xl font-semibold shadow-[0_8px_30px_-4px_var(--glow)] transition-all duration-300 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Create Goal
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal, index) => {
              const accent = goalAccentColors[index % goalAccentColors.length]
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => router.push(`/goals/${goal.id}`)}
                  className="glass-card rounded-2xl p-6 cursor-pointer relative overflow-hidden group border-l-[3px]"
                  style={{ borderLeftColor: `var(--nx-${['violet','cyan','emerald','amber','coral'][index % 5]})` }}
                >
                  {/* Top gradient stripe */}
                  <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${accent.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getStatusIcon(goal.status)}
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-300 truncate">{goal.title}</h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0 ${getRiskColor(goal.failure_probability * 100)}`}>
                      {getRiskLabel(goal.failure_probability * 100)}
                    </span>
                  </div>

                  {goal.description && (
                    <p className="text-xs text-muted-foreground mb-5 line-clamp-2 leading-relaxed">
                      {goal.description}
                    </p>
                  )}

                  <div className="space-y-4 pt-3 border-t border-primary/[0.06]">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-4 h-4 text-muted-foreground/60" />
                      <span>Deadline: {new Date(goal.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Health Score</span>
                        <span className="font-bold text-foreground/90">{goal.execution_health_score}/100</span>
                      </div>

                      <div className="h-2 bg-primary/[0.04] border border-primary/[0.06] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.execution_health_score}%` }}
                          transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                          className={`h-full bg-gradient-to-r ${accent.gradient} rounded-full shadow-[0_0_8px_var(--glow)]`}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
