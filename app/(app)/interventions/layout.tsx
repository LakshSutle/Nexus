import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Intervention Center | NEXUS',
  description: 'Manage and review AI-driven rescue plans designed to mitigate execution failure risks and reschedule tasks.',
}

export default function InterventionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
