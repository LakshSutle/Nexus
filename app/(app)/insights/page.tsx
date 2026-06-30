"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase"
import { api } from "@/lib/api"
import { ArrowLeft } from "lucide-react"

export default function InsightsPage() {
  const router = useRouter()
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [userId, setUserId] = useState<string>("")

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      try {
        const data = await api.getInsights(user.id)
        setInsights(data.insights)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleRegenerate() {
    setRegenerating(true)
    try {
      const data = await api.generateInsights(userId)
      setInsights(data.insights)
    } finally {
      setRegenerating(false)
    }
  }

  const insightConfig = {
    strength: {
      border: "border-l-green-500",
      icon: "⚡",
      badge: "bg-green-500/20 text-green-400"
    },
    pattern: {
      border: "border-l-yellow-500",
      icon: "📊",
      badge: "bg-yellow-500/20 text-yellow-400"
    },
    risk: {
      border: "border-l-red-500",
      icon: "⚠️",
      badge: "bg-red-500/20 text-red-400"
    },
    win: {
      border: "border-l-blue-500",
      icon: "🏆",
      badge: "bg-blue-500/20 text-blue-400"
    }
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#4F9EFF]/20 border-t-[#4F9EFF] rounded-full animate-spin mx-auto"/>
        <p className="text-white/50 text-sm">Generating your insights...</p>
      </div>
    </div>
  )

  const stats = insights?.stats || {}
  const insightList = insights?.insights || []

  return (
    <div className="p-8 md:p-10 space-y-8 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to dashboard
        </button>
        <div className="flex-1" />
        <div>
          <h1 className="text-2xl font-bold text-white">Weekly Insights</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-[#4F9EFF]/20 text-[#4F9EFF] px-2 py-0.5 rounded-full">
              ✦ Powered by NEXUS AI
            </span>
          </div>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/70 px-4 py-2 rounded-lg hover:bg-white/10 transition-all disabled:opacity-50 text-sm cursor-pointer"
        >
          {regenerating ? (
            <div className="w-4 h-4 border border-white/20 border-t-white rounded-full animate-spin"/>
          ) : "🔄"}
          {regenerating ? "Generating..." : "Regenerate"}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Tasks Completed",
            value: stats.tasks_completed ?? 0,
            color: "text-green-400"
          },
          {
            label: "Completion Rate",
            value: `${stats.completion_rate ?? 0}%`,
            color: stats.completion_rate > 60 ? "text-green-400" : stats.completion_rate > 30 ? "text-yellow-400" : "text-red-400"
          },
          {
            label: "Goals On Track",
            value: stats.goals_on_track ?? 0,
            color: "text-[#4F9EFF]"
          },
          {
            label: "Best Performance Day",
            value: stats.best_day ? new Date(stats.best_day).toLocaleDateString("en", {weekday:"short", month:"short", day:"numeric"}) : "N/A",
            color: "text-white"
          }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl p-4.5 relative overflow-hidden group"
          >
            <div className={`text-2xl font-black ${stat.color} tracking-tight`}>{stat.value}</div>
            <div className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Weekly summary */}
      {insights?.weekly_summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#4F9EFF]/5 border border-[#4F9EFF]/25 rounded-2xl p-6 shadow-[0_0_15px_rgba(79,158,255,0.03)] relative overflow-hidden"
        >
          <div className="text-[10px] text-[#4F9EFF] font-bold mb-2 uppercase tracking-widest">📊 Weekly Performance Executive Summary</div>
          <p className="text-white/80 leading-relaxed text-sm">{insights.weekly_summary}</p>
          {insights.top_recommendation && (
            <p className="text-[#4F9EFF] italic text-xs mt-3 flex items-center gap-1.5 font-medium">
              <span>💡</span>
              <span><strong>Recommendation:</strong> {insights.top_recommendation}</span>
            </p>
          )}
        </motion.div>
      )}

      {/* Insight cards */}
      {insightList.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Surfaced Analytics & Signals</h2>
          {insightList.map((insight: any, i: number) => {
            const config = insightConfig[insight.type as keyof typeof insightConfig] || insightConfig.pattern

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className={`glass-card border-l-4 ${config.border} rounded-2xl p-5 relative overflow-hidden`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base leading-none">{config.icon}</span>
                      <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${config.badge}`}>
                        {insight.category}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-1">{insight.headline}</h3>
                    <p className="text-white/50 text-xs leading-relaxed">{insight.detail}</p>
                    {insight.type === "risk" && (
                      <a href="/interventions" className="text-[#4F9EFF] text-xs mt-2 inline-block hover:underline font-semibold">
                        View rescue plan →
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4">
          <div className="text-4xl">📊</div>
          <p className="text-white/60">Your first insights generate after a week of tracking</p>
          <button
            onClick={handleRegenerate}
            className="bg-[#4F9EFF] text-white px-6 py-2 rounded-lg hover:bg-[#4F9EFF]/90 transition-all cursor-pointer"
          >
            Generate now →
          </button>
        </div>
      )}
    </div>
  )
}

