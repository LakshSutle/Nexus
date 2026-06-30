import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Goal Timeline | NEXUS',
  description: 'View your goal milestones, tasks schedule, daily cognitive load, and execute pending items.',
}

export default function TimelineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
