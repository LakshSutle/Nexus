import { ArrowRight, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Reveal } from './reveal'
import Link from 'next/link'

export function FinalCta() {
  return (
    <section id="cta" className="px-6 pb-28">
      <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl px-6 py-24 text-center">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[oklch(0.65_0.28_285_/_20%)] via-[oklch(0.75_0.18_195_/_10%)] to-background" />
        <div className="absolute inset-0 -z-10 border border-primary/20 rounded-3xl" />

        {/* Aurora orbs */}
        <div className="pointer-events-none absolute left-1/2 top-0 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.65_0.28_285_/_18%)] blur-[120px] animate-[aurora-drift_12s_ease-in-out_infinite_alternate]" />
        <div className="pointer-events-none absolute right-0 bottom-0 size-[300px] rounded-full bg-[oklch(0.75_0.18_195_/_12%)] blur-[100px] animate-[aurora-drift_15s_ease-in-out_infinite_alternate-reverse]" />

        <h2 className="relative mx-auto max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Stop managing tasks.{' '}
          <span className="text-gradient-aurora">Start finishing goals.</span>
        </h2>

        <p className="relative mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
          Join thousands of ambitious builders who trust NEXUS to keep them on track.
        </p>

        <div className="relative mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login">
            <Button
              size="lg"
              className="pulse-glow group border border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 text-base font-semibold rounded-2xl shadow-[0_8px_30px_-4px_var(--glow)]"
            >
              Get started free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Social proof */}
        <div className="relative mt-10 flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 bg-card/60 backdrop-blur-sm border border-border/50 rounded-full px-4 py-2">
            <Bot className="size-4 text-primary" />
            <span>Powered by <strong className="text-foreground">Google Gemini 2.0</strong></span>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
