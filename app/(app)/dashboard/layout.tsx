import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | NEXUS',
  description: 'Monitor your goal execution health, track failure prediction metrics, and view real-time insights from autonomous AI agents.',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
