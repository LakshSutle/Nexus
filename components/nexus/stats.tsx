import { CountUp } from './count-up'
import { Reveal } from './reveal'

const stats = [
  {
    value: <CountUp end={68} suffix="%" />,
    label: 'Average failure risk detected before deadline',
    color: 'text-gradient-aurora',
  },
  {
    value: <CountUp end={18} suffix="s" />,
    label: 'Time to generate a full execution plan',
    color: 'text-gradient-aurora',
  },
  {
    value: '1 tap',
    label: 'To accept an AI rescue plan',
    color: 'text-gradient-aurora',
  },
]

export function Stats() {
  return (
    <section className="relative z-10 px-6">
      <Reveal className="mx-auto -mt-10 max-w-5xl overflow-hidden rounded-2xl border border-primary/15 bg-card/70 backdrop-blur-xl shadow-[0_8px_40px_-12px_var(--glow)]">
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <dl className="grid grid-cols-1 divide-y divide-border/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-2.5 px-6 py-10 text-center group">
              <dt className={`text-5xl font-bold tracking-tight ${stat.color}`}>
                {stat.value}
              </dt>
              <dd className="max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  )
}
