"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/api"
import { ArrowRight, Activity, Clock } from "lucide-react"

interface AgentEvent {
  id: string
  agent_name: string
  message: string
  event_type: string
  created_at: string
}

interface Goal {
  id: string
  title: string
}

export default function GoalAgentsPage() {
  const params = useParams()
  const router = useRouter()
  const goalId = params.id as string

  const [events, setEvents] = useState<AgentEvent[]>([])
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "planning" | "tracking" | "interventions" | "insights">("all")
  const [lastUpdated, setLastUpdated] = useState(0)
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set())
  const seenEventIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    async function loadGoal() {
      try {
        const res = await api.getGoal(goalId)
        if (res.goal) setGoal(res.goal)
      } catch (err) {
        console.error("Failed to load goal:", err)
      }
    }
    loadGoal()
  }, [goalId])

  useEffect(() => {
    let interval: NodeJS.Timeout
    let timestampInterval: NodeJS.Timeout

    const pollEvents = async () => {
      try {
        const res = await api.getAgentEvents(goalId)
        if (res.events) {
          const newEvents = res.events as AgentEvent[]
          const currentIds = new Set(newEvents.map(e => e.id))

          // Detect new events
          const newlyAdded = newEvents.filter(e => !seenEventIdsRef.current.has(e.id))
          if (newlyAdded.length > 0) {
            setNewEventIds(new Set(newlyAdded.map(e => e.id)))
            // Clear new event flash after 2 seconds
            setTimeout(() => setNewEventIds(new Set()), 2000)
          }

          // Update seen IDs
          seenEventIdsRef.current = currentIds
          setEvents(newEvents)
          setLastUpdated(Date.now())
        }
      } catch (err) {
        console.error("Failed to poll events:", err)
      }
    }

    // Initial load
    pollEvents()

    // Poll every 3 seconds
    interval = setInterval(pollEvents, 3000)

    // Update timestamp every second
    timestampInterval = setInterval(() => {
      setLastUpdated(prev => prev + 1000)
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(timestampInterval)
    }
  }, [goalId])

  const getAgentEmoji = (agentName: string) => {
    if (agentName === "Goal Ingestion Agent") return "🤖"
    if (agentName === "Task Decomposition Agent") return "🔧"
    if (agentName === "Scheduling Agent") return "📅"
    if (agentName === "Failure Prediction Agent") return "⚠️"
    if (agentName === "Replanning Agent") return "🔁"
    if (agentName === "Intervention Agent") return "⚡"
    if (agentName === "Master Orchestrator") return "✦"
    if (agentName === "Progress Tracking Agent") return "📊"
    if (agentName === "Insight Agent") return "💡"
    return "⚡"
  }

  const getAgentBorderColor = (agentName: string) => {
    if (agentName === "Goal Ingestion Agent") return "border-blue-500"
    if (agentName === "Task Decomposition Agent") return "border-purple-500"
    if (agentName === "Scheduling Agent") return "border-green-500"
    if (agentName === "Failure Prediction Agent") return "border-orange-500"
    if (agentName === "Replanning Agent") return "border-yellow-500"
    if (agentName === "Intervention Agent") return "border-red-500"
    if (agentName === "Master Orchestrator") return "border-[#4F9EFF]"
    if (agentName === "Progress Tracking Agent") return "border-teal-500"
    return "border-gray-500"
  }

  const getAgentColor = (agentName: string) => {
    if (agentName === "Goal Ingestion Agent") return "text-blue-400"
    if (agentName === "Task Decomposition Agent") return "text-purple-400"
    if (agentName === "Scheduling Agent") return "text-green-400"
    if (agentName === "Failure Prediction Agent") return "text-orange-400"
    if (agentName === "Replanning Agent") return "text-yellow-400"
    if (agentName === "Intervention Agent") return "text-red-400"
    if (agentName === "Master Orchestrator") return "text-[#4F9EFF]"
    if (agentName === "Progress Tracking Agent") return "text-teal-400"
    if (agentName === "Insight Agent") return "text-pink-400"
    return "text-white"
  }

  const getEventTypeBadge = (eventType: string) => {
    const colors: Record<string, string> = {
      analysis: "bg-blue-500/20 text-blue-400",
      action: "bg-green-500/20 text-green-400",
      decision: "bg-yellow-500/20 text-yellow-400",
      warning: "bg-red-500/20 text-red-400"
    }
    return colors[eventType] || "bg-gray-500/20 text-gray-400"
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

  const getFilteredEvents = () => {
    const planningAgents = ["Goal Ingestion Agent", "Task Decomposition Agent", "Scheduling Agent"]
    const trackingAgents = ["Progress Tracking Agent", "Failure Prediction Agent"]
    const interventionAgents = ["Intervention Agent", "Replanning Agent"]
    const insightAgents = ["Insight Agent"]

    switch (filter) {
      case "planning":
        return events.filter(e => planningAgents.includes(e.agent_name))
      case "tracking":
        return events.filter(e => trackingAgents.includes(e.agent_name))
      case "interventions":
        return events.filter(e => interventionAgents.includes(e.agent_name))
      case "insights":
        return events.filter(e => insightAgents.includes(e.agent_name))
      default:
        return events
    }
  }

  const filteredEvents = getFilteredEvents()
  const latestEvent = events[0]
  const isLive = latestEvent && (Date.now() - new Date(latestEvent.created_at).getTime()) < 300000
  const secondsSinceUpdate = Math.floor((Date.now() - lastUpdated) / 1000)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-[#4F9EFF]/20 border-t-[#4F9EFF] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">Agent Activity Feed</h1>
            {goal && <p className="text-muted-foreground">{goal.title}</p>}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
              <span className="text-sm text-muted-foreground">
                {isLive ? "🟢 Live" : "⚫ Idle"}
              </span>
            </div>
            <button
              onClick={() => router.push(`/goals/${goalId}/timeline`)}
              className="text-[#4F9EFF] hover:underline flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to timeline
            </button>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Clock className="w-4 h-4" />
          <span>Last updated {secondsSinceUpdate}s ago</span>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {["all", "planning", "tracking", "interventions", "insights"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[#4F9EFF] text-white"
                  : "bg-card border border-border hover:bg-accent"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-16">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">No agent activity yet</h2>
                <p className="text-muted-foreground">
                  Agents will appear here once you create and generate a goal plan
                </p>
              </div>
            ) : (
              filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-card border-l-4 ${getAgentBorderColor(event.agent_name)} ${
                    newEventIds.has(event.id) ? "border-r-4 border-r-green-500" : ""
                  } border border-border rounded-lg p-4`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-xl">{getAgentEmoji(event.agent_name)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${getAgentColor(event.agent_name)}`}>
                          {event.agent_name}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getEventTypeBadge(event.event_type)}`}>
                          {event.event_type}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {getRelativeTime(event.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="font-mono text-sm text-white/80 pl-8">{event.message}</p>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Load More */}
        {events.length > 20 && (
          <button className="w-full mt-6 py-3 bg-card border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors">
            Load more
          </button>
        )}
      </div>
    </div>
  )
}
