"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase"
import { api } from "@/lib/api"
import { ArrowLeft, Activity, Clock, AlertCircle, CheckCircle, Bot } from "lucide-react"

interface AgentEvent {
  id: string
  goal_id: string
  agent_name: string
  event_type: string
  message: string
  created_at: string
}

interface Goal {
  id: string
  title: string
}

export default function AgentsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [goals, setGoals] = useState<Record<string, Goal>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "planning" | "tracking" | "interventions" | "insights">("all")

  useEffect(() => {
    async function loadEvents() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push("/login")
          return
        }

        const goalsRes = await api.getGoals(user.id)
        if (goalsRes.goals) {
          const goalMap: Record<string, Goal> = {}
          goalsRes.goals.forEach((g: Goal) => {
            goalMap[g.id] = g
          })
          setGoals(goalMap)

          // Fetch agent events for all goals
          const allEvents: AgentEvent[] = []
          for (const goal of goalsRes.goals) {
            const eventsRes = await api.getAgentEvents(goal.id)
            if (eventsRes.events) {
              allEvents.push(...eventsRes.events)
            }
          }
          
          // Sort by created_at descending
          allEvents.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          setEvents(allEvents)
        }
      } catch (err) {
        console.error("Failed to load agent events:", err)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [router])

  const filteredEvents = events.filter(e => {
    if (filter === "all") return true
    if (filter === "planning") return e.agent_name.includes("Ingestion") || e.agent_name.includes("Decomposition") || e.agent_name.includes("Scheduling")
    if (filter === "tracking") return e.agent_name.includes("Progress") || e.agent_name.includes("Execution")
    if (filter === "interventions") return e.agent_name.includes("Failure") || e.agent_name.includes("Intervention") || e.agent_name.includes("Replanning")
    if (filter === "insights") return e.agent_name.includes("Insight")
    return true
  })

  const getAgentIcon = (agentName: string) => {
    if (agentName.includes("Failure") || agentName.includes("Intervention")) return AlertCircle
    if (agentName.includes("Progress") || agentName.includes("Execution")) return Activity
    if (agentName.includes("Insight")) return CheckCircle
    return Bot
  }

  const getAgentColor = (agentName: string) => {
    if (agentName.includes("Failure") || agentName.includes("Intervention")) return "text-red-400"
    if (agentName.includes("Progress") || agentName.includes("Execution")) return "text-[#4F9EFF]"
    if (agentName.includes("Insight")) return "text-green-400"
    return "text-purple-400"
  }

  const getEventIcon = (eventType: string) => {
    if (eventType === "action") return "⚡"
    if (eventType === "decision") return "🎯"
    if (eventType === "warning") return "⚠️"
    return "🔍"
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const then = new Date(dateString)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#4F9EFF]/20 border-t-[#4F9EFF] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 md:p-10 space-y-6">
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
        <h1 className="text-2xl font-bold text-white">Agent Activity</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {[
          { id: "all", label: "All" },
          { id: "planning", label: "Planning" },
          { id: "tracking", label: "Tracking" },
          { id: "interventions", label: "Interventions" },
          { id: "insights", label: "Insights" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.id
                ? "bg-[#4F9EFF] text-white"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No agent activity yet</p>
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const Icon = getAgentIcon(event.agent_name)
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 hover:border-[#4F9EFF]/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg bg-white/5 ${getAgentColor(event.agent_name)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{event.agent_name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                        {getEventIcon(event.event_type)} {event.event_type}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm mb-2">{event.message}</p>
                    <div className="flex items-center gap-3 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(event.created_at)}
                      </span>
                      {goals[event.goal_id] && (
                        <span>• {goals[event.goal_id].title}</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
