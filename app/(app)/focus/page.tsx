"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase"
import { api } from "@/lib/api"
import confetti from "canvas-confetti"
import { Clock, ArrowRight, Check, Target } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  estimated_hours: number
  scheduled_date: string
  status: "pending" | "completed" | "skipped"
  goal_id: string
}

interface Goal {
  id: string
  title: string
}

interface TasksByGoal {
  goal: Goal
  tasks: Task[]
}

export default function FocusPage() {
  const router = useRouter()
  const [tasksByGoal, setTasksByGoal] = useState<TasksByGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(0)
  const [totalTasks, setTotalTasks] = useState(0)

  useEffect(() => {
    async function loadAllFocusTasks() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push("/login")
          return
        }

        // Get all goals for user
        const goalsRes = await api.getGoals(user.id)
        if (!goalsRes.goals) return

        const goals = goalsRes.goals as Goal[]

        // Get focus tasks for each goal
        const tasksPromises = goals.map(async (goal) => {
          const res = await api.getFocusTasks(goal.id)
          return {
            goal,
            tasks: res.tasks || []
          }
        })

        const results = await Promise.all(tasksPromises)
        const withTasks = results.filter(r => r.tasks.length > 0)
        
        setTasksByGoal(withTasks)
        setTotalTasks(withTasks.reduce((sum, r) => sum + r.tasks.length, 0))
      } catch (err) {
        console.error("Failed to load focus tasks:", err)
      } finally {
        setLoading(false)
      }
    }

    loadAllFocusTasks()
  }, [router])

  const completeTask = async (taskId: string) => {
    // Optimistic update
    setTasksByGoal(prev => 
      prev.map(g => ({
        ...g,
        tasks: g.tasks.filter(t => t.id !== taskId)
      }))
    )
    setCompleted(prev => prev + 1)

    // API call
    await api.completeTask(taskId)

    // Confetti if all done
    if (completed + 1 >= totalTasks) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4F9EFF', '#22C55E', '#ffffff']
      })
    }
  }

  const skipTask = async (taskId: string) => {
    setTasksByGoal(prev => 
      prev.map(g => ({
        ...g,
        tasks: g.tasks.filter(t => t.id !== taskId)
      }))
    )
    await api.skipTask(taskId)
  }

  const getMotivationalText = () => {
    if (completed === 0) return "Let's go. Start with task 1."
    if (completed === 1) return "Great start! Keep going."
    if (completed === 2) return "Almost there. One more."
    return "🎉 You crushed today's focus!"
  }

  const allTasks = tasksByGoal.flatMap(g => g.tasks)
  const hasOverdue = allTasks.some(t => {
    const today = new Date().toISOString().split('T')[0]
    return t.scheduled_date < today && t.status === "pending"
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-2 border-[#4F9EFF]/20 border-t-[#4F9EFF] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 md:p-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Today's Focus</h1>
            <p className="text-white/45 text-sm">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-[#4F9EFF] bg-[#4F9EFF]/5 hover:bg-[#4F9EFF]/10 border border-[#4F9EFF]/20 hover:border-[#4F9EFF]/40 px-3.5 py-1.5 rounded-full text-xs font-semibold hover:underline flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            Back to dashboard
          </button>
        </div>

        {/* Overdue Alert */}
        {hasOverdue && (
          <div className="glow-pill-yellow border border-yellow-500/20 text-yellow-400 px-4.5 py-3 rounded-2xl mb-6 flex items-center gap-2 text-sm font-semibold">
            <span>⚡</span>
            <span>You have overdue tasks from yesterday</span>
          </div>
        )}

        {/* Task Cards by Goal */}
        <AnimatePresence mode="popLayout">
          {allTasks.length === 0 && completed === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <p className="text-5xl mb-4">📅</p>
              <h2 className="text-2xl font-bold text-white mb-2">Nothing scheduled today</h2>
              <p className="text-white/40 mb-6 max-w-sm mx-auto text-sm">Check back tomorrow or view your full timeline to add tasks.</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-[#4F9EFF] hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all cursor-pointer"
              >
                View Dashboard →
              </button>
            </motion.div>
          ) : allTasks.length === 0 && completed > 0 ? (
            /* All Done State */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20"
              >
                <Check className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">All done for today! 🎉</h2>
              <p className="text-white/40 text-sm mb-6">You completed {completed} tasks</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-[#4F9EFF] hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all cursor-pointer"
              >
                View Dashboard →
              </button>
            </motion.div>
          ) : (
            /* Task Cards by Goal */
            <div className="space-y-8">
              {tasksByGoal.map((group, groupIndex) => (
                <div key={group.goal.id} className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/[0.04]">
                    <Target className="w-4.5 h-4.5 text-[#4F9EFF]" />
                    <h3 className="text-md font-bold text-white/95">{group.goal.title}</h3>
                  </div>
                  <div className="space-y-4">
                    {group.tasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ delay: (groupIndex * 0.3) + (index * 0.15) }}
                        className="glass-card rounded-2xl p-6 relative overflow-hidden group"
                      >
                        {/* Large Watermark Number */}
                        <div className="text-gradient-primary text-[72px] font-black opacity-[0.06] leading-none select-none absolute -bottom-1.5 right-4 group-hover:scale-105 transition-transform duration-300 pointer-events-none">
                          {String(index + 1).padStart(2, '0')}
                        </div>

                        <div className="flex items-start justify-between gap-6 relative z-10">
                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white mb-2 leading-snug">{task.title}</h3>
                            <div className="flex items-center gap-2 text-white/50 text-xs mb-3 bg-white/[0.02] border border-white/[0.04] w-fit rounded-lg px-2 py-1">
                              <Clock className="w-3.5 h-3.5 text-[#4F9EFF]" />
                              <span className="font-semibold">~{task.estimated_hours}h</span>
                            </div>
                            {task.description && (
                              <p className="text-white/40 italic text-xs leading-relaxed">{task.description}</p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 shrink-0 ml-2">
                            <button
                              onClick={() => completeTask(task.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-green-500/10 hover:shadow-green-500/20 cursor-pointer"
                            >
                              ✓ Complete
                            </button>
                            <button
                              onClick={() => skipTask(task.id)}
                              className="bg-white/[0.02] hover:bg-white/5 border border-white/[0.06] text-white/60 hover:text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                            >
                              Skip →
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Progress Section */}
        {totalTasks > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">{completed} of {totalTasks} tasks done today</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4 border border-white/[0.04]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completed / totalTasks) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full shadow-[0_0_10px_rgba(79,158,255,0.4)]"
              />
            </div>
            <p className="text-center text-white/60 text-sm italic font-medium">{getMotivationalText()}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
