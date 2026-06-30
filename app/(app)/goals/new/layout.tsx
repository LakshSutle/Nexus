import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Goal | NEXUS',
  description: 'Create a new goal on NEXUS. Upload PRDs, syllabi, or course documents to automatically structure a schedule.',
}

export default function NewGoalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
