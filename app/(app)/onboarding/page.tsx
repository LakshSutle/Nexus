"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { api } from "@/lib/api"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [persona, setPersona] = useState("")
  const [peakHours, setPeakHours] = useState("morning")
  const [dailyHours, setDailyHours] = useState(2.5)
  const [goalTitle, setGoalTitle] = useState("")
  const [deadline, setDeadline] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const personas = [
    {
      id: "student",
      icon: "🎓",
      title: "Student",
      desc: "Managing courses, exams, and assignments",
      tags: ["Exams", "Deadlines", "Study plans"]
    },
    {
      id: "professional",
      icon: "💼",
      title: "Professional",
      desc: "Delivering projects and work commitments",
      tags: ["Projects", "Milestones", "Accountability"]
    },
    {
      id: "entrepreneur",
      icon: "🚀",
      title: "Entrepreneur",
      desc: "Building products and startup milestones",
      tags: ["Launch goals", "Sprints", "Growth"]
    }
  ]

  async function handleFinish() {
    if (!goalTitle || !deadline) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError("")
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user")

      // Save preferences
      await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        persona,
        peak_hours: peakHours,
        daily_available_hours: dailyHours
      })

      // Create first goal
      const goalRes = await api.createGoal({
        title: goalTitle,
        deadline,
        daily_hours: dailyHours,
        user_id: user.id
      })

      if (!goalRes.goal?.id) {
        throw new Error("Goal creation failed")
      }

      const goalId = goalRes.goal.id

      // Generate plan
      await api.generatePlan(goalId, file || undefined)

      router.push(`/goals/${goalId}/generating`)
    } catch (e) {
      console.error(e)
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  // Calculate min date once
  const minDate = new Date(Date.now() + 86400000).toISOString().split("T")[0]

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 md:p-10">
      <div className="w-full max-w-lg">

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`
              rounded-full transition-all
              ${s === step ? "w-6 h-2 bg-[#4F9EFF]" : s < step ? "w-2 h-2 bg-[#4F9EFF]/60" : "w-2 h-2 bg-white/20"}
            `}
            />
          ))}
        </div>

        <div className="text-center mb-2">
          <span className="text-white/40 text-sm">Step {step} of 3</span>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* STEP 1 — Persona */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white">Welcome to NEXUS ✦</h1>
              <p className="text-white/50 mt-2">Let's personalize your experience</p>
            </div>

            {personas.map(p => (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`w-full text-left p-5 rounded-xl border transition-all cursor-pointer
                  ${persona === p.id ? "border-[#4F9EFF] bg-[#4F9EFF]/10 scale-[1.02]" : "border-white/10 bg-white/5 hover:border-white/20"}
                `}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-3xl mb-2">{p.icon}</div>
                    <div className="font-semibold text-white">{p.title}</div>
                    <div className="text-white/50 text-sm mt-1">{p.desc}</div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {p.tags.map(t => (
                        <span key={t} className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                  {persona === p.id && (
                    <div className="text-[#4F9EFF] text-xl">✓</div>
                  )}
                </div>
              </button>
            ))}

            <button
              onClick={() => setStep(2)}
              disabled={!persona}
              className="w-full bg-[#4F9EFF] text-white font-medium py-3 rounded-lg mt-4 disabled:opacity-30 hover:bg-[#4F9EFF]/90 transition-all cursor-pointer"
            >
              Continue →
            </button>
          </div>
        )}

        {/* STEP 2 — Schedule */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white">When do you work best?</h1>
              <p className="text-white/50 mt-2">We'll schedule hard tasks during your peak hours</p>
            </div>

            {/* Peak hours */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "morning", icon: "🌅", label: "Morning", time: "6am–12pm" },
                { id: "afternoon", icon: "☀️", label: "Afternoon", time: "12pm–6pm" },
                { id: "evening", icon: "🌙", label: "Evening", time: "6pm–12am" }
              ].map(h => (
                <button
                  key={h.id}
                  onClick={() => setPeakHours(h.id)}
                  className={`p-4 rounded-xl border text-center transition-all cursor-pointer
                    ${peakHours === h.id ? "border-[#4F9EFF] bg-[#4F9EFF]/10" : "border-white/10 bg-white/5 hover:border-white/20"}
                  `}
                >
                  <div className="text-2xl mb-1">{h.icon}</div>
                  <div className="text-white text-sm font-medium">{h.label}</div>
                  <div className="text-white/40 text-xs">{h.time}</div>
                </button>
              ))}
            </div>

            {/* Daily hours slider */}
            <div className="space-y-3">
              <label className="text-white/70 text-sm">Daily hours available</label>
              <div className="relative pt-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2">
                  <span className="bg-[#4F9EFF] text-white text-xs px-2 py-1 rounded">{dailyHours}h</span>
                </div>
                <input
                  type="range"
                  min="0.5" max="8" step="0.5"
                  value={dailyHours}
                  onChange={e => setDailyHours(Number(e.target.value))}
                  className="w-full accent-[#4F9EFF]"
                />
              </div>
              <div className="text-center text-white/50 text-sm">{dailyHours} hours per day</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-white/10 text-white/60 py-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-[#4F9EFF] text-white font-medium py-3 rounded-lg hover:bg-[#4F9EFF]/90 transition-all cursor-pointer"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — First Goal */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white">What's your first goal?</h1>
              <p className="text-white/50 mt-2">You can add more later</p>
            </div>

            <input
              type="text"
              placeholder="e.g. Pass Data Structures Final Exam"
              value={goalTitle}
              onChange={e => setGoalTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 py-3 px-4 rounded-lg focus:outline-none focus:border-[#4F9EFF]"
            />

            <input
              type="date"
              value={deadline}
              min={minDate}
              onChange={e => setDeadline(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white py-3 px-4 rounded-lg focus:outline-none focus:border-[#4F9EFF]"
            />

            {/* File upload */}
            <div
              onDrop={e => {
                e.preventDefault()
                e.stopPropagation()
                const f = e.dataTransfer.files[0]
                if (f) setFile(f)
              }}
              onDragOver={e => {
                e.preventDefault()
                e.stopPropagation()
              }}
              className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-[#4F9EFF]/50 transition-all"
            >
              {file ? (
                <div className="space-y-1">
                  <div className="text-green-400 text-2xl">✓</div>
                  <p className="text-white/70 text-sm">{file.name}</p>
                  <button
                    onClick={() => setFile(null)}
                    className="text-white/30 text-xs hover:text-white/60 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-3xl">📄</div>
                  <p className="text-white/50 text-sm">Drop your syllabus or brief here</p>
                  <p className="text-white/30 text-xs">Optional · PDF, DOCX, TXT</p>
                  <label className="cursor-pointer text-[#4F9EFF] text-sm hover:underline">
                    or browse
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) setFile(f)
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-white/10 text-white/60 py-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              >
                ← Back
              </button>
              <button
                onClick={handleFinish}
                disabled={!goalTitle || !deadline || loading}
                className="flex-1 bg-[#4F9EFF] text-white font-medium py-3 rounded-lg disabled:opacity-30 hover:bg-[#4F9EFF]/90 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin"/>
                    Creating...
                  </>
                ) : "Let's go! →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

