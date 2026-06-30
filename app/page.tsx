'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Navbar } from '@/components/nexus/navbar'
import { Hero } from '@/components/nexus/hero'
import { Stats } from '@/components/nexus/stats'
import { Features } from '@/components/nexus/features'
import { HowItWorks } from '@/components/nexus/how-it-works'
import { FinalCta } from '@/components/nexus/final-cta'
import { Footer } from '@/components/nexus/footer'

export default function Page() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkSession()
  }, [router])

  return (
    <main className="relative min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <FinalCta />
      <Footer />
    </main>
  )
}
