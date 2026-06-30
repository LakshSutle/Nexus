"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Sparkles, Trash2, Plus, Moon, Sun, ArrowRight, Bot, Target } from "lucide-react"
import { api } from "@/lib/api"
import { createClient } from "@/lib/supabase"

interface Goal {
  id: string
  title: string
}

interface CommandItem {
  id: string
  label: string
  category: "Actions" | "Goals"
  icon: React.ReactNode
  action: () => void
}

export function CommandPalette() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSearch("")
      setSelectedIndex(0)
      loadGoals()
    }
  }, [isOpen])

  // Load user goals to allow search & navigation
  const loadGoals = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const res = await api.getGoals(user.id)
        if (res.goals) {
          setGoals(res.goals)
        }
      }
    } catch (err) {
      console.error("Failed to load goals in palette:", err)
    }
  }

  // Seeding/Clearing functions
  const handleSeed = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await api.seedDemoData(session.user.id, session.user.email || "")
        setIsOpen(false)
        window.location.href = "/dashboard"
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await api.clearDemoData(session.user.id, session.user.email || "")
        setIsOpen(false)
        window.location.href = "/dashboard"
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark")
    if (isDark) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    }
    setIsOpen(false)
  }

  // Base list of static command actions
  const staticItems: CommandItem[] = [
    {
      id: "new-goal",
      label: "Create New Goal",
      category: "Actions",
      icon: <Plus className="size-4 text-blue-400" />,
      action: () => {
        router.push("/goals/new")
        setIsOpen(false)
      }
    },
    {
      id: "toggle-theme",
      label: "Toggle Theme (Light / Dark)",
      category: "Actions",
      icon: <Sun className="size-4 text-yellow-400 dark:hidden" /> || <Moon className="size-4 text-indigo-400 hidden dark:block" />,
      action: toggleTheme
    },
    {
      id: "load-demo",
      label: "Seed Demo Workspace Data",
      category: "Actions",
      icon: <Sparkles className="size-4 text-emerald-400" />,
      action: handleSeed
    },
    {
      id: "clear-demo",
      label: "Reset Workspace Database",
      category: "Actions",
      icon: <Trash2 className="size-4 text-red-400" />,
      action: handleClear
    }
  ]

  // Map user goals into search items
  const goalItems: CommandItem[] = goals.map((goal) => ({
    id: `goal-${goal.id}`,
    label: `Go to Timeline: ${goal.title}`,
    category: "Goals",
    icon: <Target className="size-4 text-purple-400" />,
    action: () => {
      router.push(`/goals/${goal.id}/timeline`)
      setIsOpen(false)
    }
  }))

  const allItems = [...staticItems, ...goalItems]

  // Filter items based on input query
  const filteredItems = allItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  )

  // Handle keyboard navigation inside list
  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action()
      }
    }
  }

  // Scroll selected item into view inside palette container
  useEffect(() => {
    const listEl = listRef.current
    if (listEl) {
      const selectedEl = listEl.children[selectedIndex] as HTMLElement
      if (selectedEl) {
        const listHeight = listEl.clientHeight
        const itemTop = selectedEl.offsetTop
        const itemHeight = selectedEl.clientHeight

        if (itemTop + itemHeight > listEl.scrollTop + listHeight) {
          listEl.scrollTop = itemTop + itemHeight - listHeight
        } else if (itemTop < listEl.scrollTop) {
          listEl.scrollTop = itemTop
        }
      }
    }
  }, [selectedIndex])

  return (
    <>
      {/* Keyboard Shortcut Indicator in layout */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Floating Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-lg bg-[#141418]/80 dark:bg-[#0c0c0f]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col glass-card text-foreground"
            >
              {/* Search input bar */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.04]">
                <Search className="size-4.5 text-white/40 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setSelectedIndex(0)
                  }}
                  onKeyDown={handleListKeyDown}
                  placeholder="Type a command or search goals..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none focus:ring-0 focus:border-none w-full"
                />
                <span className="text-[10px] bg-white/[0.04] border border-white/[0.06] text-white/40 px-2 py-0.5 rounded font-mono select-none">
                  ESC
                </span>
              </div>

              {/* Items List */}
              <div
                ref={listRef}
                className="max-h-[300px] overflow-y-auto p-2 space-y-0.5 scrollbar-none"
              >
                {filteredItems.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-8">No results found for "{search}"</p>
                ) : (
                  filteredItems.map((item, idx) => {
                    const isSelected = idx === selectedIndex
                    return (
                      <button
                        key={item.id}
                        onClick={() => item.action()}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full text-left flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
                          isSelected
                            ? "bg-white/5 dark:bg-white/[0.03] text-[#4F9EFF] border-l-2 border-l-[#4F9EFF] pl-2.5"
                            : "text-white/60 hover:text-white border-l-2 border-l-transparent"
                        }`}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {isSelected && (
                          <span className="text-[9px] font-mono text-[#4F9EFF]/70 flex items-center gap-1 select-none">
                            Enter <ArrowRight className="size-3" />
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>

              {/* Footer status bar */}
              <div className="px-4 py-2 bg-black/20 border-t border-white/[0.04] flex justify-between items-center text-[9px] text-white/30 font-medium">
                <span className="flex items-center gap-1">
                  <Bot className="size-3 text-[#4F9EFF]" />
                  NEXUS Command Core v2.0
                </span>
                <span className="flex items-center gap-1 select-none">
                  Use arrows <span className="font-mono">↑↓</span> and <span className="font-mono">Enter</span>
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
