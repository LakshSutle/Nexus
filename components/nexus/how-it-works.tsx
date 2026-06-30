import { Reveal } from './reveal'

const steps = [
  { text: 'Set your goal + deadline', color: 'from-[oklch(0.65_0.28_285)] to-[oklch(0.55_0.24_285)]' },
  { text: 'Upload any supporting document', color: 'from-[oklch(0.75_0.18_195)] to-[oklch(0.65_0.16_195)]' },
  { text: 'AI builds your complete plan', color: 'from-[oklch(0.72_0.19_155)] to-[oklch(0.6_0.17_155)]' },
  { text: 'Execute while AI monitors', color: 'from-[oklch(0.78_0.16_75)] to-[oklch(0.68_0.14_75)]' },
  { text: 'Get rescued if you fall behind', color: 'from-[oklch(0.65_0.22_25)] to-[oklch(0.55_0.2_25)]' },
]

export function HowItWorks() {
  return (
    <section id="how" className="px-6 py-28">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-gradient-aurora">
            How it works
          </span>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            From blank page to{' '}
            <span className="text-muted-foreground">finished goal.</span>
          </h2>
        </Reveal>

        <ol className="relative mt-16 ml-4 pl-10">
          {/* Gradient timeline line */}
          <div className="absolute left-[0.95rem] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[oklch(0.65_0.28_285_/_30%)] via-[oklch(0.75_0.18_195_/_20%)] to-[oklch(0.72_0.19_155_/_10%)]" />

          {steps.map((step, i) => (
            <Reveal as="li" key={step.text} delay={i * 120} className="relative pb-12 last:pb-0">
              {/* Glowing node */}
              <span className="absolute -left-[2.55rem] flex size-10 items-center justify-center">
                {/* Glow ring */}
                <span
                  className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} opacity-20 blur-[6px]`}
                  style={{ animationDelay: `${i * 0.5}s` }}
                />
                {/* Node */}
                <span className={`relative flex size-9 items-center justify-center rounded-full bg-background border-2 border-primary/20 font-mono text-sm font-bold bg-gradient-to-br ${step.color} text-white shadow-lg`}>
                  {i + 1}
                </span>
              </span>
              <p className="pt-1.5 text-lg font-semibold text-foreground">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
