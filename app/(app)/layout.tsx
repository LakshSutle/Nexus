import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import {
  Hexagon, LayoutDashboard, Target, Focus, AlertCircle,
  Bot, LogOut, User, BarChart3, Settings
} from 'lucide-react'
import Link from 'next/link'
import { MobileNav } from '@/components/ui/mobile-nav'
import { DemoDataButton } from '@/components/ui/demo-data-button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { CommandPalette } from '@/components/ui/command-palette'
import { StatusOrb } from '@/components/ui/status-orb'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Detect current path for active nav
  const headersList = await headers()
  const fullUrl = headersList.get('x-url') || headersList.get('referer') || ''
  const pathname = headersList.get('x-pathname') || (fullUrl ? new URL(fullUrl, 'http://localhost').pathname : '')

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/goals', icon: Target, label: 'Goals' },
    { href: '/focus', icon: Focus, label: 'Focus' },
    { href: '/interventions', icon: AlertCircle, label: 'Interventions' },
    { href: '/agents', icon: Bot, label: 'Agent Feed' },
    { href: '/insights', icon: BarChart3, label: 'Insights' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]

  const renderNavItem = (item: typeof navItems[0]) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`h-9 px-2 text-[13px] font-medium flex items-center gap-2.5 rounded-lg transition-all duration-150 cursor-pointer ${
          isActive
            ? 'text-white bg-[var(--accent-blue-dim)] border-l-2 border-[var(--accent-blue)] pl-[6px]'
            : 'text-[var(--text-muted)] bg-transparent hover:text-[var(--text-secondary)] hover:bg-white/5'
        }`}
      >
        <item.icon className="size-4 shrink-0 opacity-70" />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <div className="flex min-h-screen premium-bg text-[var(--text-primary)]">
      <CommandPalette />
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] relative z-10 h-screen sticky top-0">
        
        {/* Logo Section */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-bold text-white text-base">
              NEXUS <span className="text-[var(--accent-blue)]">✦</span>
            </div>
            <StatusOrb userId={session.user.id} />
          </div>
          <div className="h-[1px] bg-[var(--border-subtle)] w-full" />
        </div>

        {/* Nav list with Sections */}
        <div className="flex-1 px-3 space-y-4 overflow-y-auto">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] px-2 py-1 uppercase">Workspace</div>
            <div className="space-y-0.5 mt-1">
              {navItems.slice(0, 2).map(renderNavItem)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] px-2 py-1 uppercase">Execution</div>
            <div className="space-y-0.5 mt-1">
              {navItems.slice(2, 5).map(renderNavItem)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] px-2 py-1 uppercase">Analytics</div>
            <div className="space-y-0.5 mt-1">
              {navItems.slice(5).map(renderNavItem)}
            </div>
          </div>
        </div>

        {/* Bottom controls & Tech Badge */}
        <div className="px-3 py-2 space-y-2 mt-auto">
          <ThemeToggle />
          <DemoDataButton userId={session.user.id} />
          
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-3 text-center relative overflow-hidden">
            <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">System Core</p>
            <p className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Gemini 2.0 Flash
            </p>
            <p className="text-[9px] text-[var(--text-muted)] mt-0.5 font-medium">Google Cloud Orchestrator</p>
          </div>
        </div>

        {/* User profile row */}
        <div className="border-t border-[var(--border-subtle)] p-4 flex items-center justify-between gap-2.5 bg-black/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-full bg-[var(--accent-blue-dim)] border border-[var(--border-default)] flex items-center justify-center text-xs font-bold text-[var(--accent-blue)] shrink-0 select-none">
              {(session.user.email?.[0] || 'U').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[var(--text-muted)] truncate max-w-[110px]">
                {session.user.email}
              </p>
            </div>
          </div>
          <form action="/auth/signout" method="POST" className="shrink-0">
            <button
              type="submit"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0 relative z-10">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  )
}