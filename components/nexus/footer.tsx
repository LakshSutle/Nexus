import { Hexagon } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/50 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2.5 font-medium text-foreground">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary/12 text-primary">
            <Hexagon className="size-3.5" strokeWidth={2.5} />
          </span>
          <span className="font-bold text-gradient-primary">NEXUS</span>
        </div>
        <p className="text-muted-foreground/60">© 2026 NEXUS. All rights reserved.</p>
      </div>
    </footer>
  )
}
