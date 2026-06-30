import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Focus Mode | NEXUS',
  description: 'Deep work dashboard to execute high-impact and overdue tasks scheduled for today.',
}

export default function FocusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
