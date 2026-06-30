"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase"

interface AgentEvent {
  id: string
  agent_name: string
  message: string
  event_type: string
  created_at: string
}

export default function GoalGeneratingPage() {
  const params = useParams()
  const goalId = params.id as string

  const [events, setEvents] = useState<AgentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState(false)
  const [progress, setProgress] = useState(0)
  const [taskCount, setTaskCount] = useState(0)
  const [slowWarning, setSlowWarning] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    let timeout1: NodeJS.Timeout
    let timeout2: NodeJS.Timeout

    const pollEvents = async () => {
      try {
        const res = await api.getAgentEvents(goalId)
        if (res.events) {
          const newEvents = res.events as AgentEvent[]
          setEvents(newEvents.reverse())

          // Calculate progress based on agents seen
          const agentsSeen = new Set(newEvents.map(e => e.agent_name))
          if (agentsSeen.has("Goal Ingestion Agent")) setProgress(33)
          if (agentsSeen.has("Task Decomposition Agent")) setProgress(66)
          if (agentsSeen.has("Master Orchestrator")) setProgress(100)

          // Check for completion
          const completeEvent = newEvents.find(e => 
            e.message.toLowerCase().includes("pipeline complete") || 
            e.message.toLowerCase().includes("plan complete")
          )
          if (completeEvent) {
            // Extract task count from message
            const taskMatch = completeEvent.message.match(/(\d+) tasks/)
            if (taskMatch) setTaskCount(parseInt(taskMatch[1]))

            setCompleted(true)
            clearInterval(interval)
            clearTimeout(timeout1)
            clearTimeout(timeout2)

            // Auto-sync Google Calendar if linked
            const autoSync = async () => {
              try {
                const supabaseClient = createClient()
                const { data: { session } } = await supabaseClient.auth.getSession()
                const providerToken = session?.provider_token
                console.log("Auto-syncing scheduled tasks to Google Calendar...")
                await api.syncCalendar(goalId, providerToken || undefined)
              } catch (err) {
                console.error("Auto calendar sync failed:", err)
              }
            }
            autoSync()

            // Redirect after 2 seconds
            setTimeout(() => {
              window.location.href = `/goals/${goalId}/timeline`
            }, 2000)
          }
        }
      } catch (err) {
        console.error("Failed to poll events:", err)
      }
    }

    // Initial poll
    pollEvents()

    // Poll every 2 seconds
    interval = setInterval(pollEvents, 2000)

    // Show slow warning after 10 seconds
    timeout1 = setTimeout(() => {
      if (!completed && events.length === 0) {
        setSlowWarning(true)
      }
    }, 10000)

    // Show error after 45 seconds
    timeout2 = setTimeout(() => {
      if (!completed) {
        setError(true)
        setLoading(false)
        clearInterval(interval)
      }
    }, 45000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout1)
      clearTimeout(timeout2)
    }
  }, [goalId, completed])

  const getAgentColor = (agentName: string) => {
    if (agentName === "Goal Ingestion Agent") return "text-blue-400"
    if (agentName === "Task Decomposition Agent") return "text-purple-400"
    if (agentName === "Scheduling Agent") return "text-green-400"
    if (agentName === "Master Orchestrator") return "text-[#4F9EFF]"
    return "text-white"
  }

  const getAgentEmoji = (agentName: string) => {
    if (agentName === "Goal Ingestion Agent") return "📄"
    if (agentName === "Task Decomposition Agent") return "🔧"
    if (agentName === "Scheduling Agent") return "📅"
    if (agentName === "Master Orchestrator") return "🤖"
    return "⚡"
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 md:p-10">
      <div className="max-w-md w-full text-center">
        {/* Spinner / Checkmark */}
        <div className="flex justify-center mb-8">
          {completed ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </motion.div>
          ) : error ? (
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          ) : (
            <div className="w-16 h-16 border-4 border-[#4F9EFF]/20 border-t-[#4F9EFF] rounded-full animate-spin" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">
          {completed ? "Your plan is ready!" : "NEXUS is building your plan"}
        </h1>
        <p className="text-white/60 mb-8">
          {completed 
            ? `${taskCount} tasks created across your timeline`
            : "AI agents are working..."
          }
        </p>

        {/* Agent Feed */}
        {!error && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
            <div className="max-h-[300px] overflow-y-auto space-y-2 text-left">
              <AnimatePresence>
                {events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-sm"
                  >
                    <span className={getAgentColor(event.agent_name)}>
                      {getAgentEmoji(event.agent_name)} {event.agent_name}
                    </span>
                    <span className="text-white/60"> · </span>
                    <span className="text-white/80">{event.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {events.length === 0 && !slowWarning && (
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Waiting for agents to start...
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-[#4F9EFF]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Slow Warning */}
        {slowWarning && !completed && !error && (
          <p className="text-yellow-500 text-sm mb-4">
            This is taking longer than usual...
          </p>
        )}

        {/* Error State */}
        {error && (
          <div className="space-y-4">
            <p className="text-red-400">
              Failed to generate your plan. The AI agents may be unavailable.
            </p>
            <a
              href="/dashboard"
              className="inline-block bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
