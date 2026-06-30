import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agent Feed | NEXUS',
  description: 'View real-time activity and decision-making from the 9 autonomous AI agents running in the background.',
}

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
