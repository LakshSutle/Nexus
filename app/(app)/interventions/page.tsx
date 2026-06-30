"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase"
import { api } from "@/lib/api"
import confetti from "canvas-confetti"
import { CheckCircle, AlertCircle, Clock, ChevronDown, ChevronUp, X, ArrowLeft } from "lucide-react"
import { ToastNotification } from "@/components/ui/toast-notification"

interface Intervention {
  id: string
  goal_id: string
  intervention_type: string
  failure_probability: number
  message: string
  proposed_plan: {
    risk_factors: string[]
    recommendation: string
  }
  status: "pending" | "accepted" | "dismissed"
  created_at: string
  goals?: {
    title: string
    deadline: string
  }
}

export default function InterventionsPage() {
  const router = useRouter()
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const dismissToast = useCallback(() => setToast(null), [])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    async function loadInterventions() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const res = await api.getInterventions(user.id)
        if (res.interventions) {
          setInterventions(res.interventions)
        }
      } catch (err) {
        console.error("Failed to load interventions:", err)
      } finally {
        setLoading(false)
      }
    }

    loadInterventions()
  }, [])

  const acceptIntervention = async (id: string) => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const providerToken = session?.provider_token

      await api.acceptIntervention(id, providerToken)

      // Confetti
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ['#22C55E', '#4F9EFF']
      })

      // Remove from list
      setInterventions(prev => prev.filter(i => i.id !== id))

      // Show success toast
      setToast(
        providerToken
          ? "✅ Rescue plan accepted! Your schedule and Google Calendar have been updated."
          : "✅ Rescue plan accepted! Your schedule has been updated."
      )
      setTimeout(() => setToast(null), 4000)
    } catch (err) {
      console.error("Failed to accept rescue plan:", err)
      setToast("❌ Failed to apply rescue plan.")
      setTimeout(() => setToast(null), 4000)
    }
  }

  const dismissIntervention = async (id: string) => {
    await api.dismissIntervention(id)
    setInterventions(prev => prev.filter(i => i.id !== id))
  }

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const pendingInterventions = interventions.filter(i => i.status === "pending")
  const historyInterventions = interventions.filter(i => i.status !== "pending")

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-[#4F9EFF]/20 border-t-[#4F9EFF] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 fade-up">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-6">
        <div>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to dashboard
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight">Intervention Center</h1>
        </div>
        <div>
          {pendingInterventions.length > 0 ? (
            <span className="badge text-[var(--accent-red)] bg-[var(--accent-red-dim)] text-xs font-bold rounded-full px-3 py-1">
              {pendingInterventions.length} active alert{pendingInterventions.length === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="badge text-[var(--accent-green)] bg-[var(--accent-green-dim)] text-xs font-bold rounded-full px-3 py-1">
              All clear
            </span>
          )}
        </div>
      </div>

      {/* Active Interventions */}
      <AnimatePresence mode="popLayout">
        {pendingInterventions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 glass shadow-lg p-10 max-w-md mx-auto"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--accent-green-dim)] flex items-center justify-center border border-[var(--border-default)]">
              <CheckCircle className="w-8 h-8 text-[var(--accent-green)]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">All Systems Clear</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-1">No active risks detected</p>
            <p className="text-xs text-[var(--text-muted)]">NEXUS is monitoring your goals in real time</p>
          </motion.div>
        ) : (
            pendingInterventions.map((intervention) => (
              <motion.div
                key={intervention.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass p-7 border-l-3 border-l-[var(--accent-red)] rounded-2xl mb-6 relative overflow-hidden group glow-red shadow-lg"
              >
                {/* Top Row */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[var(--accent-red)] pulse-dot" />
                    <span className="text-[10px] text-[var(--accent-red)] font-bold uppercase tracking-[0.1em]">
                      CRITICAL
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Clock className="w-3.5 h-3.5" />
                    {getRelativeTime(intervention.created_at)}
                  </div>
                </div>

                {/* Goal Name */}
                <h2 className="text-xl font-bold text-white mb-5">
                  {intervention.goals?.title || "Unknown Goal"}
                </h2>

                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-4 mb-6 border-y border-[var(--border-subtle)] py-4">
                  <div className="text-center border-r border-[var(--border-subtle)]">
                    <p className="text-3xl font-extrabold text-[var(--accent-red)]">
                      {Math.round(intervention.failure_probability * 100)}%
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 uppercase font-semibold">Failure Risk</p>
                  </div>
                  <div className="text-center border-r border-[var(--border-subtle)]">
                    <p className="text-3xl font-extrabold text-[var(--accent-amber)]">
                      {Math.max(0, Math.floor(
                        (new Date().getTime() - new Date(intervention.goals?.deadline || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
                      ))}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 uppercase font-semibold">Days Behind</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-extrabold text-white">
                      {intervention.goals?.deadline ? new Date(intervention.goals.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 uppercase font-semibold">Deadline</p>
                  </div>
                </div>

                {/* Risk Factors */}
                <div className="mb-6">
                  <p className="text-[11px] font-bold text-[var(--accent-amber)] uppercase tracking-wider mb-2">⚠️ Risk Factors</p>
                  <ul className="space-y-1">
                    {intervention.proposed_plan?.risk_factors?.map((factor, i) => (
                      <li key={i} className="flex items-start gap-1 py-1 text-sm text-[var(--text-secondary)] border-b border-[var(--border-subtle)] last:border-0">
                        <span className="text-[var(--accent-amber)] mr-2 font-bold">›</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendation */}
                <div className="bg-[var(--accent-blue-dim)] border border-blue-500/20 rounded-xl p-3 px-4 mb-6 text-xs text-[var(--text-secondary)] flex items-start gap-2.5">
                  <span className="text-lg leading-none shrink-0 mt-0.5">💡</span>
                  <p className="leading-relaxed">
                    <strong>AI Recommendation:</strong> {intervention.proposed_plan?.recommendation}
                  </p>
                </div>

                {/* Agent Reasoning Chain */}
                <div className="mb-6 bg-black/10 p-4 rounded-xl border border-[var(--border-subtle)]">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] mb-3 uppercase tracking-widest">
                    🤖 Agent Reasoning Pipeline
                  </p>
                  <div className="space-y-3">
                    {[
                      { agent: "Progress Tracking Agent", icon: "📊", msg: `Velocity tracking: ${intervention.proposed_plan?.velocity_gap?.actual || '?'}/${intervention.proposed_plan?.velocity_gap?.required || '?'} tasks/day` },
                      { agent: "Failure Prediction Agent", icon: "⚠️", msg: `Risk detected: ${Math.round(intervention.failure_probability * 100)}% failure probability` },
                      { agent: "Replanning Agent", icon: "🔄", msg: "Rescue plan generated with optimized schedule" },
                      { agent: "Intervention Agent", icon: "🚨", msg: `Surfaced ${intervention.proposed_plan?.severity || 'CRITICAL'} intervention to user` },
                    ].map((step, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 text-xs"
                      >
                        <div className="flex flex-col items-center">
                          <span className="w-6 h-6 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-xs shrink-0 select-none">
                            {step.icon}
                          </span>
                          {i < 3 && <div className="w-0.5 h-4 bg-[var(--border-subtle)] mt-1" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-[var(--text-primary)]">{step.agent}</span>
                          <p className="text-[var(--text-muted)] mt-0.5 text-[11px] leading-relaxed truncate">{step.msg}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buttons (stacked, gap: 8px) */}
                <div className="space-y-2 flex flex-col w-full gap-2">
                  <button
                    onClick={() => acceptIntervention(intervention.id)}
                    className="w-full bg-[var(--accent-green)] hover:shadow-lg hover:shadow-green-500/10 text-black py-3.5 rounded-xl font-bold transition-all cursor-pointer text-center text-sm"
                  >
                    ✓ Accept Rescue Plan
                  </button>
                  <button
                    onClick={() => dismissIntervention(intervention.id)}
                    className="w-full bg-transparent border border-[var(--border-default)] text-[var(--text-muted)] hover:text-white py-2.5 rounded-xl font-semibold transition-all hover:bg-white/5 cursor-pointer text-center text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {/* History Section */}
        {historyInterventions.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors mb-4"
            >
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Intervention History
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  {historyInterventions.map((intervention) => (
                    <div
                      key={intervention.id}
                      className="flex items-center justify-between p-4 border-b border-border last:border-b-0"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400">
                          {new Date(intervention.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-sm font-medium">
                          {intervention.goals?.title || "Unknown Goal"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          intervention.status === "accepted"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {intervention.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {intervention.status === "accepted" ? "Plan applied" : "Dismissed"}
                        </span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      {/* Toast Notification */}
      <ToastNotification toast={toast} onDismiss={dismissToast} />
    </div>
  )
}
