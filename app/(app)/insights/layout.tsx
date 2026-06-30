import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Execution Insights | NEXUS',
  description: 'Deep performance analytics, cognitive load feedback, and trajectory trends computed by the Insight Agent.',
}

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
