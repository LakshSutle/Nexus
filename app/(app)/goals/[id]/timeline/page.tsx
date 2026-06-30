"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { createClient } from "@/lib/supabase"
import { motion } from "framer-motion"
import { CheckCircle, Circle, Play, Bot, RefreshCw, Clock, SkipForward, Check, ArrowLeft } from "lucide-react"
import confetti from "canvas-confetti"

interface Task {
  id: string
  title: string
  description: string
  estimated_hours: number
  scheduled_date: string
  status: "pending" | "completed" | "skipped"
  milestone_id: string | null
}

interface Milestone {
  id: string
  title: string
  description: string
  sequence_order: number
}

interface Goal {
  id: string
  title: string
  deadline: string
  failure_probability: number
  execution_health_score: number
  status: string
  milestones?: Milestone[]
  tasks?: Task[]
}

export default function GoalTimelinePage() {
  const params = useParams()
  const router = useRouter()
  const goalId = params.id as string

  const [goal, setGoal] = useState<Goal | null>(null)
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "today" | "pending" | "completed">("all")
  const [replanning, setReplanning] = useState(false)
  const [healthScore, setHealthScore] = useState(0)

  const [syncingCalendar, setSyncingCalendar] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const handleSyncCalendar = async () => {
    setSyncingCalendar(true)
    setSyncMessage(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const providerToken = session?.provider_token
      if (!providerToken) {
        setSyncMessage("Error: Please log in with Google to sync calendar.")
        setSyncingCalendar(false)
        return
      }

      const res = await api.syncCalendar(goalId, providerToken)
      if (res.success) {
        setSyncMessage(`Successfully synced ${res.synced_count} tasks!`)
      } else {
        setSyncMessage("Failed to sync calendar.")
      }
    } catch (err: any) {
      console.error("Calendar sync error:", err)
      setSyncMessage(err.message || "Failed to sync calendar.")
    } finally {
      setSyncingCalendar(false)
      setTimeout(() => setSyncMessage(null), 5000)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    async function loadData() {
      try {
        const [goalRes, healthRes] = await Promise.all([
          api.getGoal(goalId),
          api.getGoalHealth(goalId)
        ])

        if (goalRes.goal) setGoal(goalRes.goal)
        if (healthRes) setHealth(healthRes)

        // Animate health score
        const targetScore = healthRes?.health_score || 0
        interval = setInterval(() => {
          setHealthScore(prev => {
            if (prev >= targetScore) {
              clearInterval(interval)
              return targetScore
            }
            return prev + 1
          })
        }, 20)
      } catch (err) {
        console.error("Failed to load goal:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [goalId])

  const handleCompleteTask = async (taskId: string) => {
    if (!goal) return

    // Optimistic update
    setGoal(prev => {
      if (!prev) return prev
      return {
        ...prev,
        tasks: prev.tasks?.map(t =>
          t.id === taskId ? { ...t, status: "completed" as const } : t
        )
      }
    })

    // Confetti burst on complete
    confetti({
      particleCount: 55,
      spread: 50,
      origin: { y: 0.8 },
      colors: ["#22c55e", "#4F9EFF", "#a855f7"]
    })

    try {
      await api.completeTask(taskId)
      // Refresh health
      const healthRes = await api.getGoalHealth(goalId)
      if (healthRes) setHealth(healthRes)
    } catch (err) {
      console.error("Failed to complete task:", err)
      // Revert on error
      setGoal(prev => {
        if (!prev) return prev
        return {
          ...prev,
          tasks: prev.tasks?.map(t =>
            t.id === taskId ? { ...t, status: "pending" as const } : t
          )
        }
      })
    }
  }

  const handleSkipTask = async (taskId: string) => {
    if (!goal) return

    // Optimistic update
    setGoal(prev => {
      if (!prev) return prev
      return {
        ...prev,
        tasks: prev.tasks?.map(t =>
          t.id === taskId ? { ...t, status: "skipped" as const } : t
        )
      }
    })

    try {
      await api.skipTask(taskId)
    } catch (err) {
      console.error("Failed to skip task:", err)
      // Revert on error
      setGoal(prev => {
        if (!prev) return prev
        return {
          ...prev,
          tasks: prev.tasks?.map(t =>
            t.id === taskId ? { ...t, status: "pending" as const } : t
          )
        }
      })
    }
  }

  const handleReplan = async () => {
    setReplanning(true)
    try {
      await api.generatePlan(goalId)
      window.location.reload()
    } catch (err) {
      console.error("Failed to replan:", err)
      setReplanning(false)
    }
  }

  const getFilteredTasks = () => {
    if (!goal?.tasks) return []

    const today = new Date().toISOString().split('T')[0]

    switch (filter) {
      case "today":
        return goal.tasks.filter(t => t.scheduled_date === today)
      case "pending":
        return goal.tasks.filter(t => t.status === "pending")
      case "completed":
        return goal.tasks.filter(t => t.status === "completed")
      default:
        return goal.tasks
    }
  }

  const getHealthColor = (score: number) => {
    if (score > 79) return "#22c55e"
    if (score > 49) return "#eab308"
    return "#ef4444"
  }

  const getStatusColor = (status: string) => {
    if (status === "completed") return "bg-green-500"
    if (status === "skipped") return "bg-gray-500"
    return "bg-[#4F9EFF]"
  }

  const isTaskToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0]
    return date === today
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-[#4F9EFF]/20 border-t-[#4F9EFF] rounded-full animate-spin" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Goal not found</p>
      </div>
    )
  }

  const getCuratedResource = (title: string) => {
    const t = title.toLowerCase()
    if (t.includes("process") || t.includes("thread") || t.includes("schedule")) {
      return {
        title: "Process Scheduling & Context Switching Lecture",
        source: "MIT OpenCourseWare (YouTube)",
        url: "https://www.youtube.com/watch?v=17X2LpY-Ggw",
        duration: "28 min watch"
      }
    }
    if (t.includes("memory") || t.includes("paging") || t.includes("segment")) {
      return {
        title: "Operating Systems Paging & Virtual Memory Architecture",
        source: "GeeksforGeeks OS Guide",
        url: "https://www.geeksforgeeks.org/memory-management-in-operating-system/",
        duration: "15 min read"
      }
    }
    if (t.includes("file") || t.includes("storage") || t.includes("directory")) {
      return {
        title: "File Allocation Methods & Disk Management Guide",
        source: "Neso Academy (YouTube)",
        url: "https://www.youtube.com/watch?v=knW6ESzZ_V0",
        duration: "18 min watch"
      }
    }
    if (t.includes("data structure") || t.includes("array") || t.includes("list")) {
      return {
        title: "Data Structures & Algorithms Course for Beginners",
        source: "freeCodeCamp (YouTube)",
        url: "https://www.youtube.com/watch?v=RBSGKlAacol",
        duration: "45 min watch"
      }
    }
    if (t.includes("recursion") || t.includes("sorting") || t.includes("search")) {
      return {
        title: "Understanding Binary Search & Merge Sort Visualizations",
        source: "HackerRank prep tutorials",
        url: "https://www.youtube.com/watch?v=Vca808JTbI8",
        duration: "12 min watch"
      }
    }
    if (t.includes("graph") || t.includes("tree") || t.includes("heap")) {
      return {
        title: "Interactive Binary Search Trees & Graph Algorithms Simulator",
        source: "Visualgo Interactive Portal",
        url: "https://visualgo.net/en/bst",
        duration: "20 min read"
      }
    }
    return {
      title: `${title} Deep-Dive Syllabus Reference`,
      source: "Official Developer Documentation",
      url: "https://google.com",
      duration: "10 min read"
    }
  }

  const filteredTasks = getFilteredTasks()
  const milestones = goal.milestones || []

  return (
    <div className="flex min-h-screen">
      {/* LEFT SIDEBAR */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-[280px] flex-shrink-0 border-r border-primary/[0.06] bg-card/40 backdrop-blur-2xl p-6 space-y-6"
      >
        {/* Back Link */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 text-sm mb-4 hover:-translate-x-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </button>

        {/* Goal Header */}
        <div>
          <h2 className="text-lg font-bold mb-2 text-gradient-primary leading-tight">{goal.title}</h2>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground">
              Due {new Date(goal.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/[0.04] border border-primary/[0.08] w-fit text-xs">
            <span className={`size-1.5 rounded-full ${goal.status === "active" ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
            <span className="text-foreground/70 capitalize">{goal.status}</span>
          </div>
        </div>

        {/* Health Card */}
        <div className="bg-primary/[0.03] border border-primary/[0.08] rounded-xl p-4 relative overflow-hidden">
          <div className="flex justify-center mb-2">
            <div className="relative w-20 h-20 overflow-visible">
              <svg className="w-20 h-20 transform -rotate-90 overflow-visible">
                <defs>
                  <linearGradient id="health-grad-tl" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="oklch(0.65 0.28 285)" />
                    <stop offset="100%" stopColor={getHealthColor(healthScore)} />
                  </linearGradient>
                  <filter id="health-glow-timeline" x="-25%" y="-25%" width="150%" height="150%">
                    <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={getHealthColor(healthScore)} floodOpacity="0.5" />
                  </filter>
                </defs>
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  className="text-primary/[0.06]"
                  strokeWidth="6"
                  fill="none"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="url(#health-grad-tl)"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  filter="url(#health-glow-timeline)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: healthScore / 100 }}
                  transition={{ duration: 1 }}
                  style={{ strokeDasharray: "226.19" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-extrabold text-gradient-aurora">{healthScore}</span>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {Math.round(goal.failure_probability * 100)}% failure risk
          </p>
        </div>

        {/* Milestone List */}
        <div>
          <h3 className="text-xs font-bold mb-3 uppercase tracking-wider text-muted-foreground">Milestones</h3>
          <div className="space-y-2">
            {milestones.map((m, i) => {
              const milestoneTasks = goal.tasks?.filter(t => t.milestone_id === m.id) || []
              const completed = milestoneTasks.filter(t => t.status === "completed").length
              const isCurrent = i === 0 && completed < milestoneTasks.length

              return (
                <button
                  key={m.id}
                  onClick={() => {
                    const element = document.getElementById(`milestone-${m.id}`)
                    element?.scrollIntoView({ behavior: "smooth" })
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/[0.08] transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {isCurrent ? (
                      <Circle className="w-3.5 h-3.5 text-primary fill-primary shadow-[0_0_8px_var(--glow)]" />
                    ) : completed === milestoneTasks.length ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />
                    )}
                    <span className="text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors truncate">{m.title}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-5.5">
                    <span className="text-[10px] text-muted-foreground">
                      {completed}/{milestoneTasks.length} tasks
                    </span>
                    <div className="flex-1 h-1 bg-primary/5 rounded-full overflow-hidden border border-primary/10">
                      <div
                        className="h-full bg-primary shadow-[0_0_6px_var(--glow)]"
                        style={{ width: `${milestoneTasks.length > 0 ? (completed / milestoneTasks.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-3 border-t border-primary/[0.06]">
          <button
            onClick={() => router.push("/focus")}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl text-xs font-semibold shadow-[0_4px_16px_-4px_var(--glow)] transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            Focus View
          </button>
          <button
            onClick={() => router.push("/agents")}
            className="w-full flex items-center justify-center gap-2 bg-primary/5 border border-primary/15 text-foreground py-2.5 rounded-xl text-xs font-semibold hover:bg-primary/10 transition-all cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            Agent Feed
          </button>
          <button
            onClick={handleReplan}
            disabled={replanning}
            className="w-full flex items-center justify-center gap-2 bg-primary/5 border border-primary/15 text-foreground py-2.5 rounded-xl text-xs font-semibold hover:bg-primary/10 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${replanning ? 'animate-spin' : ''}`} />
            Replan
          </button>
          <button
            onClick={handleSyncCalendar}
            disabled={syncingCalendar}
            className="w-full flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 text-primary py-2.5 rounded-xl text-xs font-semibold hover:bg-primary/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {syncingCalendar ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span className="text-sm leading-none">📅</span>
            )}
            Sync Calendar
          </button>
          {syncMessage && (
            <p className="text-center text-[10px] text-primary mt-1.5 animate-pulse font-medium">
              {syncMessage}
            </p>
          )}
        </div>
      </motion.aside>

      {/* RIGHT MAIN AREA */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gradient-primary">Tasks</h1>
            <div className="flex gap-2">
              {["all", "today", "pending", "completed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                    filter === f
                      ? "bg-primary text-primary-foreground shadow-[0_4px_16px_-4px_var(--glow)]"
                      : "bg-primary/5 border border-primary/10 text-muted-foreground hover:text-foreground hover:bg-primary/10"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Empty State */}
          {filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <p className="text-muted-foreground mb-2">No tasks yet</p>
              <p className="text-sm text-muted-foreground/70 mb-6">Your plan is still being generated</p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-[0_4px_16px_-4px_var(--glow)]"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          )}

          {/* Task Cards by Milestone */}
          <div className="space-y-6">
            {milestones.map((milestone) => {
              const milestoneTasks = filteredTasks.filter(t => t.milestone_id === milestone.id)
              if (milestoneTasks.length === 0) return null

              return (
                <div key={milestone.id} id={`milestone-${milestone.id}`} className="space-y-3">
                  <div className="sticky top-0 bg-background/60 backdrop-blur-md border-b border-primary/[0.06] py-3.5 mb-4 z-10 flex items-center">
                    <h3 className="font-bold text-gradient-primary text-sm">📍 Milestone {milestone.sequence_order + 1}: {milestone.title}</h3>
                  </div>

                  <div className="space-y-3">
                    {milestoneTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`glass-card rounded-xl p-4.5 hover:-translate-y-0.5 transition-all duration-300 ${
                          task.status === "completed" ? "border-green-500/25 bg-green-500/[0.02]" : ""
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Left colored bar */}
                          <div className={`w-1 self-stretch rounded-full ${
                            task.status === "completed"
                              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                              : task.status === "skipped"
                              ? "bg-muted-foreground/35"
                              : "bg-primary shadow-[0_0_8px_var(--glow)]"
                          }`} />

                          {/* Task content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-1">
                              <h4 className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors duration-300">{task.title}</h4>
                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className="text-[10px] bg-primary/5 border border-primary/10 text-muted-foreground px-2 py-0.5 rounded font-bold">
                                  ~{task.estimated_hours}h
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(task.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                              </div>
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground/75 line-clamp-1">{task.description}</p>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {task.status === "pending" ? (
                              <>
                                <button
                                  onClick={() => handleCompleteTask(task.id)}
                                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all cursor-pointer shadow-lg shadow-green-500/15"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleSkipTask(task.id)}
                                  className="p-2 bg-primary/5 border border-primary/15 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
                                >
                                  <SkipForward className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : task.status === "completed" ? (
                              <div className="p-2 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="p-2 bg-primary/5 border border-primary/10 text-muted-foreground/55 rounded-lg">
                                <SkipForward className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Curated Resource Widget (9th Agent) */}
                  <div className="mt-4 p-4.5 bg-primary/5 border border-primary/10 rounded-xl relative overflow-hidden flex items-start gap-3.5 shadow-sm">
                    <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-lg shrink-0 select-none">
                      💡
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] bg-primary/20 text-primary font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          Curated Study Block
                        </span>
                        <span className="text-[9px] text-muted-foreground/70">
                          Resource Curation Agent
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-xs truncate">
                        {getCuratedResource(milestone.title).title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                        We recommend this high-yield resource for this milestone. (Source: {getCuratedResource(milestone.title).source})
                      </p>
                      <a
                        href={getCuratedResource(milestone.title).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline font-semibold mt-2.5 inline-block cursor-pointer"
                      >
                        Launch Learning Resource → ({getCuratedResource(milestone.title).duration})
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Tasks without milestone */}
            {filteredTasks.filter(t => !t.milestone_id).length > 0 && (
              <div className="space-y-3 pt-4">
                <div className="sticky top-0 bg-background/60 backdrop-blur-md border-b border-primary/[0.06] py-3.5 mb-4 z-10">
                  <h3 className="font-bold text-gradient-primary text-sm">📍 Uncategorized Tasks</h3>
                </div>
                {filteredTasks.filter(t => !t.milestone_id).map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`glass-card rounded-xl p-4.5 hover:-translate-y-0.5 transition-all duration-300 ${
                      task.status === "completed" ? "border-green-500/25 bg-green-500/[0.02]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-1 self-stretch rounded-full ${
                        task.status === "completed"
                          ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                          : task.status === "skipped"
                          ? "bg-muted-foreground/35"
                          : "bg-primary shadow-[0_0_8px_var(--glow)]"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <h4 className="font-bold text-foreground text-sm truncate">{task.title}</h4>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-[10px] bg-primary/5 border border-primary/10 text-muted-foreground px-2 py-0.5 rounded font-bold">
                              ~{task.estimated_hours}h
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(task.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground/75 line-clamp-1">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {task.status === "pending" ? (
                          <>
                            <button
                              onClick={() => handleCompleteTask(task.id)}
                              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all cursor-pointer shadow-lg shadow-green-500/15"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSkipTask(task.id)}
                              className="p-2 bg-primary/5 border border-primary/15 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
                            >
                              <SkipForward className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : task.status === "completed" ? (
                          <div className="p-2 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="p-2 bg-primary/5 border border-primary/10 text-muted-foreground/55 rounded-lg">
                            <SkipForward className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
