"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/api"
import confetti from "canvas-confetti"
import { Clock, ArrowRight, Check, SkipForward } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  estimated_hours: number
  scheduled_date: string
  status: "pending" | "completed" | "skipped"
}

export default function GoalFocusPage() {
  const params = useParams()
  const router = useRouter()
  const goalId = params.id as string

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(0)
  const [totalTasks, setTotalTasks] = useState(0)

  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await api.getFocusTasks(goalId)
        if (res.tasks) {
          setTasks(res.tasks)
          setTotalTasks(res.tasks.length)
        }
      } catch (err) {
        console.error("Failed to load focus tasks:", err)
      } finally {
        setLoading(false)
      }
    }
    loadTasks()
  }, [goalId])

  const completeTask = async (task: Task) => {
    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== task.id))
    setCompleted(prev => prev + 1)

    // API call
    await api.completeTask(task.id)

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

  const skipTask = async (task: Task) => {
    setTasks(prev => prev.filter(t => t.id !== task.id))
    await api.skipTask(task.id)
  }

  const getMotivationalText = () => {
    if (completed === 0) return "Let's go. Start with task 1."
    if (completed === 1) return "Great start! Keep going."
    if (completed === 2) return "Almost there. One more."
    return "🎉 You crushed today's focus!"
  }

  const hasOverdue = tasks.some(t => {
    const today = new Date().toISOString().split('T')[0]
    return t.scheduled_date < today && t.status === "pending"
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-base)]">
        <div className="w-12 h-12 border-2 border-[var(--accent-blue-dim)] border-t-[var(--accent-blue)] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8 fade-up">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-[var(--border-subtle)] pb-6">
        <div>
          <button
            onClick={() => router.push(`/goals/${goalId}/timeline`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer mb-2"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            Back to timeline
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight">Today's Focus</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Overdue Alert */}
      {hasOverdue && (
        <div className="bg-[var(--accent-amber-dim)] border border-[var(--accent-amber)]/30 text-[var(--accent-amber)] px-4 py-3 rounded-xl flex items-center gap-2">
          <span>⚡</span>
          <span className="text-xs font-semibold">You have overdue tasks from yesterday</span>
        </div>
      )}

        {/* Task Cards */}
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 && completed === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <p className="text-6xl mb-4">📅</p>
              <h2 className="text-2xl font-bold text-white mb-2">Nothing scheduled today</h2>
              <p className="text-gray-400 mb-6">Check back tomorrow or view your full timeline</p>
              <button
                onClick={() => router.push(`/goals/${goalId}/timeline`)}
                className="bg-[#4F9EFF] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#4F9EFF]/90 transition-colors"
              >
                View Timeline →
              </button>
            </motion.div>
          ) : tasks.length === 0 && completed > 0 ? (
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
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500 flex items-center justify-center"
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">All done for today! 🎉</h2>
              <p className="text-gray-400 mb-6">You completed {completed} tasks</p>
              <p className="text-gray-400 mb-6">Come back tomorrow for more</p>
              <button
                onClick={() => router.push(`/goals/${goalId}/timeline`)}
                className="bg-[#4F9EFF] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#4F9EFF]/90 transition-colors"
              >
                View Timeline →
              </button>
            </motion.div>
          ) : (
            /* Task Cards */
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ delay: index * 0.15 }}
                  className="card p-5"
                >
                  <div className="flex items-center gap-6">
                    {/* Large Number */}
                    <div className="text-[var(--accent-blue)] text-[48px] font-extrabold opacity-30 leading-none select-none">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white mb-1 truncate">{task.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Est: {task.estimated_hours}h · Study block</span>
                      </div>
                      <p className="text-[12px] text-[var(--text-secondary)] italic mt-1">
                        Why: Matches peak cognitive load slot
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col items-end gap-2.5">
                      <button
                        onClick={() => completeTask(task)}
                        className="bg-[var(--accent-green)] text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:shadow-lg hover:shadow-green-500/10 transition-all cursor-pointer h-8 flex items-center justify-center"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => skipTask(task)}
                        className="text-xs text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                      >
                        Skip →
                      </button>
                    </div>
                  </div>
                </motion.div>
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
            className="mt-8 pt-6 border-t border-[var(--border-subtle)]"
          >
            <div className="flex justify-between items-center mb-2 text-xs text-[var(--text-muted)]">
              <span>{completed} of {totalTasks} study blocks completed</span>
            </div>
            <div className="h-2 bg-[var(--bg-overlay)] rounded-full overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completed / totalTasks) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)]"
              />
            </div>
            <p className="text-center text-[var(--text-secondary)] text-sm">{getMotivationalText()}</p>
          </motion.div>
        )}
    </div>
  )
}
