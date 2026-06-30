"use client"

import { useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null)

  useEffect(() => {
    // Determine the active theme from document class
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const x = e.clientX
    const y = e.clientY

    document.documentElement.style.setProperty("--x", `${x}px`)
    document.documentElement.style.setProperty("--y", `${y}px`)

    const nextTheme = theme === "dark" ? "light" : "dark"

    const applyTheme = () => {
      setTheme(nextTheme)
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark")
        localStorage.setItem("theme", "dark")
      } else {
        document.documentElement.classList.remove("dark")
        localStorage.setItem("theme", "light")
      }
    }

    if (!(document as any).startViewTransition) {
      applyTheme()
      return
    }

    (document as any).startViewTransition(() => {
      applyTheme()
    })
  }

  if (theme === null) {
    return <div className="h-9 w-full rounded-lg bg-black/5 dark:bg-white/5 animate-pulse" />
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="flex items-center justify-center gap-2 w-full rounded-xl px-3 py-2 text-xs font-semibold bg-[#4F9EFF]/5 hover:bg-[#4F9EFF]/10 border border-[#4F9EFF]/20 hover:border-[#4F9EFF]/40 text-[#4F9EFF] transition-all cursor-pointer"
    >
      {theme === "dark" ? (
        <>
          <Sun className="size-3.5 text-yellow-400" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="size-3.5 text-blue-500" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  )
}
