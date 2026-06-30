'use client'

import { useEffect, useState } from 'react'
import { Hexagon, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleTheme = () => {
    const root = document.documentElement
    const next = !dark
    root.classList.toggle('dark', next)
    root.classList.toggle('light', !next)
    setDark(next)
  }

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled
          ? 'border-b border-border/50 bg-background/70 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_1px_20px_-4px_rgba(0,0,0,0.1)]'
          : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2.5 font-semibold tracking-tight group">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_-4px_var(--glow)]">
            <Hexagon className="size-4 transition-transform duration-500 group-hover:rotate-90" strokeWidth={2.5} />
          </span>
          <span className="text-base font-bold text-gradient-primary">NEXUS</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {[
            { href: '#features', label: 'Features' },
            { href: '#how', label: 'How it works' },
            { href: '#cta', label: 'Pricing' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative py-1 transition-colors hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:rounded-full after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-xl"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Link href="/login">
            <Button
              size="sm"
              className="hidden bg-primary text-primary-foreground hover:bg-primary/90 sm:inline-flex rounded-xl font-semibold shadow-[0_4px_16px_-4px_var(--glow)]"
            >
              Start for free
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
