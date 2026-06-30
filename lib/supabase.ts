import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kiuktlhjrjnlitzyvzgn.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_XkneKTc9tw6YrpsW5iq9ug_XYzq8Dpc'
  )
}
