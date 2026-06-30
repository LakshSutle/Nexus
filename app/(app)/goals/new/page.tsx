"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase"
import { api } from "@/lib/api"
import { Upload, ArrowRight, CheckCircle, AlertCircle, Loader2, Mic, Zap } from "lucide-react"
import { SyllabusUpload } from "@/components/goals/syllabus-upload"

export default function NewGoalPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  // Step 1: Goal details
  const [title, setTitle] = useState("")
  const [deadline, setDeadline] = useState("")
  const [dailyHours, setDailyHours] = useState(2)
  const [description, setDescription] = useState("")

  // Step 2: Document upload
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Voice recognition states
  const [isListening, setIsListening] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)

  // Quick Add state
  const [quickInput, setQuickInput] = useState("")
  const [isQuickAdding, setIsQuickAdding] = useState(false)

  const handleQuickAdd = async () => {
    if (!quickInput.trim() || !user) return

    setIsQuickAdding(true)
    setError(null)

    try {
      // Parse the natural language input via Gemini
      const parsed = await api.parseVoiceGoal(quickInput)

      const goalTitle = parsed.title || quickInput.trim()
      const goalDeadline = (() => {
        if (parsed.days_to_deadline) {
          const d = new Date()
          d.setDate(d.getDate() + parsed.days_to_deadline)
          return d.toISOString().split("T")[0]
        }
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 7)
        return tomorrow.toISOString().split("T")[0]
      })()
      const goalHours = parsed.daily_hours || 2.0
      const goalDesc = parsed.description || ""

      // Create goal directly
      const goalRes = await api.createGoal({
        title: goalTitle,
        deadline: goalDeadline,
        daily_hours: goalHours,
        user_id: user.id,
        description: goalDesc || undefined
      })

      if (!goalRes.goal) {
        throw new Error("Failed to create goal")
      }

      const goalId = goalRes.goal.id

      // Generate plan
      await api.generatePlan(goalId)

      // Redirect to generating page
      window.location.href = `/goals/${goalId}/generating`
    } catch (err) {
      console.error("Quick add failed:", err)
      setError("Quick add failed. Try filling the form manually below.")
      setIsQuickAdding(false)
    }
  }

  const handleStartListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please try Chrome, Edge, or Safari.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setVoiceText("")
    }

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript
      setVoiceText(transcript)
      setIsListening(false)
      setIsProcessingVoice(true)

      try {
        const parsed = await api.parseVoiceGoal(transcript)
        console.log("Parsed voice result:", parsed)
        if (parsed.title) setTitle(parsed.title)
        if (parsed.days_to_deadline) {
          const targetDate = new Date()
          targetDate.setDate(targetDate.getDate() + parsed.days_to_deadline)
          setDeadline(targetDate.toISOString().split("T")[0])
        }
        if (parsed.daily_hours) setDailyHours(parsed.daily_hours)
        if (parsed.description) setDescription(parsed.description)
      } catch (err) {
        // Fallback: put the transcript into the title
        setTitle(transcript)
      } finally {
        setIsProcessingVoice(false)
      }
    }

    recognition.onerror = (e: any) => {
      console.warn("Speech recognition error:", e?.error || e)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }


  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUser(user)
    }
    getUser()

    // Set minimum date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setDeadline(tomorrow.toISOString().split('T')[0])
  }, [])

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile)
    }
  }

  const isValidFile = (file: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    const maxSize = 10 * 1024 * 1024 // 10MB
    return validTypes.includes(file.type) && file.size <= maxSize
  }

  const handlePlanExtracted = (plan: any, uploadedFile: File) => {
    setFile(uploadedFile)
    if (plan.goal_title) {
      setTitle(plan.goal_title)
    }
    if (plan.suggested_deadline) {
      const dateVal = new Date(plan.suggested_deadline)
      if (!isNaN(dateVal.getTime())) {
        setDeadline(plan.suggested_deadline.split("T")[0])
      }
    }
    if (plan.extraction_notes) {
      setDescription(plan.extraction_notes)
    }
    // Automatically transition to Step 3 for review
    setStep(3)
  }

  const handleCreateGoal = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Create goal
      const goalRes = await api.createGoal({
        title,
        deadline,
        daily_hours: dailyHours,
        user_id: user.id,
        description: description || undefined
      })

      console.log("Goal creation response:", goalRes)

      if (!goalRes.goal) {
        console.error("API response missing goal:", goalRes)
        throw new Error(`Failed to create goal - API returned: ${JSON.stringify(goalRes)}`)
      }

      const goalId = goalRes.goal.id

      // Generate plan
      console.log("Generating plan for goal:", goalId)
      const planRes = await api.generatePlan(goalId, file || undefined)
      console.log("Plan generation response:", planRes)

      // Redirect to generating page
      window.location.href = `/goals/${goalId}/generating`

    } catch (err) {
      console.error("Failed to create goal:", err)
      setError("Failed to create goal. Please try again.")
      setLoading(false)
    }
  }

  const canContinueStep1 = title.trim() && deadline
  const canContinueStep2 = true // Step 2 is optional

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8 fade-up">
      {/* Progress dots */}
      <div className="flex justify-center gap-3 mb-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              step === i ? "bg-[var(--accent-blue)] scale-110 shadow-[0_0_8px_rgba(79,158,255,0.5)]" : "bg-[var(--border-emphasis)]"
            }`}
          />
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-[var(--accent-red-dim)] border border-[var(--accent-red)]/35 text-[var(--accent-red)] px-4 py-3 rounded-xl flex items-center gap-2 mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            custom={1}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <h1 className="text-xl font-bold text-white">What's your goal?</h1>
              <p className="text-xs text-[var(--text-muted)] mt-1">Tell us what you want to achieve</p>
            </div>

            {/* Voice Goal Intake card */}
            <div className="bg-[var(--accent-blue-dim)] border border-blue-500/10 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-sm text-[var(--accent-blue)]">🎙️ Speak Your Goal (AI Auto-Fill)</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {isListening
                    ? "Listening... Speak your goal, deadline, and study hours."
                    : isProcessingVoice
                    ? "AI is parsing your voice input..."
                    : voiceText
                    ? `Transcribed: "${voiceText.substring(0, 60)}${voiceText.length > 60 ? '...' : ''}"`
                    : "Try: 'Prepare for Data Structures Exam in 2 weeks, studying 3 hours a day'"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartListening}
                disabled={isProcessingVoice}
                className={`size-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : isProcessingVoice
                    ? "bg-blue-500/20 text-[#4F9EFF]"
                    : "bg-[#4F9EFF]/10 hover:bg-[#4F9EFF]/20 text-[#4F9EFF]"
                }`}
              >
                {isProcessingVoice ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isListening ? (
                  <div className="size-3 bg-white rounded-full" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Goal Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pass Data Structures Final Exam"
                  className="w-full bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-xl px-4 py-3 focus:outline-none focus:border-[#4F9EFF] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  className="w-full bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-xl px-4 py-3 focus:outline-none focus:border-[#4F9EFF] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Daily Hours Available: {dailyHours} hours per day
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[var(--bg-overlay)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-blue)]"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1 font-bold">
                  <span>0.5h</span>
                  <span>8h</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any additional context..."
                  rows={3}
                  className="w-full bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-xl px-4 py-3 focus:outline-none focus:border-[#4F9EFF] resize-none text-sm"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canContinueStep1}
              className="w-full bg-[var(--accent-blue)] text-white py-2.5 rounded-xl font-semibold hover:bg-opacity-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 h-11 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            custom={1}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <h1 className="text-xl font-bold text-white">Upload a document (optional)</h1>
              <p className="text-xs text-[var(--text-muted)] mt-1">Syllabus, PRD, or assignment brief</p>
            </div>

            <SyllabusUpload
              onPlanExtracted={handlePlanExtracted}
              deadline={deadline}
              hoursPerDay={dailyHours}
            />

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] py-2.5 rounded-xl font-semibold hover:bg-white/5 transition-all cursor-pointer h-11"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-[var(--accent-blue)] text-white py-2.5 rounded-xl font-semibold hover:bg-opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 h-11 hover:shadow-lg hover:shadow-blue-500/10"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full text-center text-[var(--accent-blue)] hover:underline text-xs"
            >
              Skip for now →
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            custom={1}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <h1 className="text-xl font-bold text-white">Review & Create</h1>
              <p className="text-xs text-[var(--text-muted)] mt-1">Confirm your goal details</p>
            </div>

            <div className="card p-6 space-y-4 shadow-lg">
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Goal Title</p>
                <p className="text-sm font-semibold text-white mt-0.5">{title}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Deadline</p>
                <p className="text-sm font-semibold text-white mt-0.5">{new Date(deadline).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Daily Hours</p>
                <p className="text-sm font-semibold text-white mt-0.5">{dailyHours} hours per day</p>
              </div>
              {description && (
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Description</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{description}</p>
                </div>
              )}
              {file && (
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Document</p>
                  <p className="text-sm font-semibold text-[var(--accent-green)] mt-0.5 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[var(--accent-green)]" />
                    {file.name}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] py-2.5 rounded-xl font-semibold hover:bg-white/5 transition-all cursor-pointer h-11"
              >
                Back
              </button>
              <button
                onClick={handleCreateGoal}
                disabled={loading}
                className="flex-1 bg-[var(--accent-blue)] text-white py-2.5 rounded-xl font-semibold hover:bg-opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 h-11 hover:shadow-lg hover:shadow-blue-500/10 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Goal & Generate Plan <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div className="text-center p-6 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--accent-blue)] mx-auto mb-4" />
            <p className="text-base font-semibold text-white">Creating your goal...</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">This may take a moment</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
