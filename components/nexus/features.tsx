import { FileText, AlertTriangle, RefreshCw } from 'lucide-react'
import { Reveal } from './reveal'

const features = [
  {
    icon: FileText,
    title: 'Upload. Plan. Go.',
    body: 'Drop your syllabus, PRD, or brief. Gemini AI reads it and builds a day-by-day execution plan in seconds.',
    gradient: 'from-[oklch(0.65_0.28_285)] to-[oklch(0.55_0.24_285)]',
    glow: 'oklch(0.65 0.28 285 / 15%)',
    iconBg: 'bg-[oklch(0.65_0.28_285_/_12%)]',
    iconColor: 'text-[oklch(0.65_0.28_285)]',
    borderHover: 'hover:border-[oklch(0.65_0.28_285_/_40%)]',
  },
  {
    icon: AlertTriangle,
    title: 'Failure Prediction',
    body: "NEXUS tracks your velocity in real time and calculates the exact probability you'll miss your deadline. Before you do.",
    gradient: 'from-[oklch(0.75_0.18_195)] to-[oklch(0.65_0.16_195)]',
    glow: 'oklch(0.75 0.18 195 / 15%)',
    iconBg: 'bg-[oklch(0.75_0.18_195_/_12%)]',
    iconColor: 'text-[oklch(0.75_0.18_195)]',
    borderHover: 'hover:border-[oklch(0.75_0.18_195_/_40%)]',
  },
  {
    icon: RefreshCw,
    title: 'One-Tap Rescue',
    body: "When you're falling behind, NEXUS doesn't alert you. It fixes your plan. Accept in one tap.",
    gradient: 'from-[oklch(0.72_0.19_155)] to-[oklch(0.6_0.17_155)]',
    glow: 'oklch(0.72 0.19 155 / 15%)',
    iconBg: 'bg-[oklch(0.72_0.19_155_/_12%)]',
    iconColor: 'text-[oklch(0.72_0.19_155)]',
    borderHover: 'hover:border-[oklch(0.72_0.19_155_/_40%)]',
  },
]

export function Features() {
  return (
    <section id="features" className="px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-gradient-aurora">
            Capabilities
          </span>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            An execution engine,{' '}
            <span className="text-muted-foreground">not a checklist.</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 120}>
              <article
                className={`group relative h-full rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 transition-all duration-500 ${feature.borderHover} hover:shadow-[0_8px_40px_-8px_${feature.glow}] hover:-translate-y-1`}
              >
                {/* Top gradient stripe */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Icon with glow */}
                <div className="relative">
                  <div
                    className={`flex size-14 items-center justify-center rounded-2xl ${feature.iconBg} ${feature.iconColor} transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_-4px_${feature.glow}]`}
                  >
                    <feature.icon className="size-6" />
                  </div>
                </div>

                <h3 className="mt-7 text-xl font-bold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
