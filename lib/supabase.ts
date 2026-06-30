import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || url.includes('placeholder') || url.includes('YOUR_') || !url.startsWith('https://')) {
    url = 'https://kiuktlhjrjnlitzyvzgn.supabase.co'
  }
  if (!key || key.includes('placeholder') || key.includes('YOUR_') || key.length < 10) {
    key = 'sb_publishable_XkneKTc9tw6YrpsW5iq9ug_XYzq8Dpc'
  }

  return createBrowserClient(url, key)
}
