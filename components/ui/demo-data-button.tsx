"use client"

import { useState } from "react"
import { Sparkles, Loader2, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { createClient } from "@/lib/supabase"

export function DemoDataButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)

  const handleSeed = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !session.user) {
        throw new Error("No active session found")
      }
      
      const email = session.user.email || ""
      const uid = session.user.id

      await api.seedDemoData(uid, email)
      // Hard refresh to dashboard to load the new data
      window.location.href = "/dashboard"
    } catch (err) {
      console.error("Failed to seed demo data:", err)
      alert("Failed to seed demo data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    setClearing(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !session.user) {
        throw new Error("No active session found")
      }
      
      const email = session.user.email || ""
      const uid = session.user.id

      await api.clearDemoData(uid, email)
      // Refresh to dashboard to show clean slate
      window.location.href = "/dashboard"
    } catch (err) {
      console.error("Failed to clear demo data:", err)
      alert("Failed to clear demo data. Please try again.")
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="space-y-2 mb-2">
      <button
        onClick={handleSeed}
        disabled={loading || clearing}
        className="flex items-center justify-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 hover:border-blue-500/40 transition-all disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin text-blue-400" />
        ) : (
          <Sparkles className="size-4 text-blue-400 fill-blue-400/20" />
        )}
        {loading ? "Seeding Demo..." : "Load Demo Data"}
      </button>

      <button
        onClick={handleClear}
        disabled={loading || clearing}
        className="flex items-center justify-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all disabled:opacity-50 cursor-pointer"
      >
        {clearing ? (
          <Loader2 className="size-4 animate-spin text-red-400" />
        ) : (
          <Trash2 className="size-4 text-red-400 fill-red-400/20" />
        )}
        {clearing ? "Clearing..." : "Reset Workspace"}
      </button>
    </div>
  )
}
