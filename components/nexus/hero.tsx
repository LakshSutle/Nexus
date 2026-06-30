'use client'

import { ArrowRight, Play, Sparkles, Zap, Shield, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const words = ['on autopilot.', 'with AI agents.', 'before deadline.']

function TypingEffect() {
  const [wordIndex, setWordIndex] = useState(0)
  const [text, setText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentWord = words[wordIndex]
    const speed = isDeleting ? 40 : 70

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setText(currentWord.slice(0, text.length + 1))
        if (text.length === currentWord.length) {
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        setText(currentWord.slice(0, text.length - 1))
        if (text.length === 0) {
          setIsDeleting(false)
          setWordIndex((prev) => (prev + 1) % words.length)
        }
      }
    }, speed)

    return () => clearTimeout(timer)
  }, [text, isDeleting, wordIndex])

  return (
    <span className="text-primary">
      {text}
      <span className="animate-pulse ml-0.5 inline-block w-[3px] h-[0.85em] bg-primary align-middle rounded-full" />
    </span>
  )
}

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-16">
      {/* Animated dot grid */}
      <div className="pointer-events-none absolute inset-0 dot-grid [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]" />

      {/* Aurora gradient orbs */}
      <div className="pointer-events-none absolute left-1/3 top-1/4 size-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.65_0.28_285_/_12%)] blur-[140px] animate-[aurora-drift_15s_ease-in-out_infinite_alternate]" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 size-[35rem] rounded-full bg-[oklch(0.75_0.18_195_/_10%)] blur-[120px] animate-[aurora-drift_18s_ease-in-out_infinite_alternate-reverse]" />
      <div className="pointer-events-none absolute left-1/2 bottom-1/4 size-[30rem] -translate-x-1/2 rounded-full bg-[oklch(0.72_0.19_155_/_8%)] blur-[100px] animate-[aurora-drift_12s_ease-in-out_infinite_alternate]" />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        {/* Badge */}
        <div className="fade-up inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/8 px-5 py-2 text-sm font-medium text-primary shadow-[0_0_30px_-8px_var(--glow)] backdrop-blur-sm">
          <Sparkles className="size-3.5" />
          Now in public beta
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
        </div>

        {/* Headline */}
        <h1
          className="fade-up mt-8 text-balance text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
          style={{ animationDelay: '80ms' }}
        >
          Stop reacting.{' '}
          <span className="text-gradient-aurora">Start executing.</span>
          <span className="block mt-2">
            Your goals,{' '}
            <TypingEffect />
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="fade-up mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl"
          style={{ animationDelay: '160ms' }}
        >
          NEXUS monitors your goals in real time, predicts failure before it
          happens, and autonomously replans your schedule.{' '}
          <span className="font-semibold text-foreground/80">Not a task manager. An execution operating system.</span>
        </p>

        {/* CTA Buttons */}
        <div
          className="fade-up mt-10 flex flex-col items-center gap-4 sm:flex-row"
          style={{ animationDelay: '240ms' }}
        >
          <Link href="/login">
            <Button
              size="lg"
              className="pulse-glow group relative border border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-base font-semibold rounded-2xl shadow-[0_8px_30px_-4px_var(--glow)]"
            >
              Start for free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="border-foreground/15 bg-card/50 backdrop-blur-sm text-foreground hover:bg-foreground/5 px-8 py-6 text-base rounded-2xl"
            onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <Play className="size-4" />
            See how it works
          </Button>
        </div>

        {/* Trust signals */}
        <div
          className="fade-up mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
          style={{ animationDelay: '320ms' }}
        >
          <span className="flex items-center gap-1.5">
            <Zap className="size-3.5 text-primary" />
            Free forever
          </span>
          <span className="size-1 rounded-full bg-muted-foreground/30" />
          <span className="flex items-center gap-1.5">
            <Shield className="size-3.5 text-primary" />
            No credit card
          </span>
          <span className="size-1 rounded-full bg-muted-foreground/30" />
          <span className="flex items-center gap-1.5">
            <Bot className="size-3.5 text-primary" />
            Built with Gemini AI
          </span>
        </div>

        {/* App Preview Glow Frame */}
        <div
          className="fade-up mt-16 w-full max-w-3xl"
          style={{ animationDelay: '400ms' }}
        >
          <div className="relative rounded-2xl border border-primary/15 bg-card/60 backdrop-blur-xl p-1 shadow-[0_20px_60px_-12px_var(--glow)]">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/20 via-transparent to-transparent pointer-events-none" />
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
              <div className="flex gap-1.5">
                <span className="size-3 rounded-full bg-red-400/60" />
                <span className="size-3 rounded-full bg-yellow-400/60" />
                <span className="size-3 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-muted/50 rounded-lg px-4 py-1 text-xs text-muted-foreground font-mono">
                  nexus.app/dashboard
                </div>
              </div>
            </div>
            {/* Fake dashboard preview */}
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/10">
                  <div className="text-xs text-muted-foreground mb-2">Health Score</div>
                  <div className="text-3xl font-bold text-gradient-aurora">87</div>
                </div>
                <div className="flex-1 rounded-xl bg-gradient-to-br from-[oklch(0.72_0.19_155_/_10%)] to-transparent p-4 border border-[oklch(0.72_0.19_155_/_10%)]">
                  <div className="text-xs text-muted-foreground mb-2">Tasks Done</div>
                  <div className="text-3xl font-bold text-[oklch(0.72_0.19_155)]">14/19</div>
                </div>
                <div className="flex-1 rounded-xl bg-gradient-to-br from-[oklch(0.78_0.16_75_/_10%)] to-transparent p-4 border border-[oklch(0.78_0.16_75_/_10%)]">
                  <div className="text-xs text-muted-foreground mb-2">9 Agents</div>
                  <div className="text-3xl font-bold text-[oklch(0.78_0.16_75)]">Active</div>
                </div>
              </div>
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full w-[74%] bg-gradient-to-r from-primary to-[oklch(0.75_0.18_195)] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
