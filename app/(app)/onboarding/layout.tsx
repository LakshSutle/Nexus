import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get Started | NEXUS',
  description: 'Set up your profile and configure your peak energy hours, weekly work limits, and role definitions.',
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
