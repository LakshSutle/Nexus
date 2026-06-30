import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | NEXUS',
  description: 'Sign in to NEXUS to access your autonomous execution intelligence workspace and track your goals.',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
