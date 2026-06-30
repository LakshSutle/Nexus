import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Goals | NEXUS',
  description: 'Manage and structure your long-term goals. Ingest syllabus/PRD documents to decompose into actionable milestones.',
}

export default function GoalsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
