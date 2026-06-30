import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = 
    new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value, options }) =>
              cookieStore.set(
                name, value, options
              )
          )
        },
      },
    }
  )

  // Handle OAuth callback (Google)
  if (code) {
    const { data, error } = await 
      supabase.auth.exchangeCodeForSession(code)
    if (!error && data?.session) {
      const user = data.session.user
      const providerToken = data.session.provider_token
      const providerRefreshToken = data.session.provider_refresh_token
      
      if (providerToken && user) {
        try {
          const { data: existing } = await supabase
            .from("user_settings")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle()

          if (existing) {
            await supabase
              .from("user_settings")
              .update({
                google_access_token: providerToken,
                google_refresh_token: providerRefreshToken || null,
                updated_at: new Date().toISOString()
              })
              .eq("user_id", user.id)
          } else {
            await supabase
              .from("user_settings")
              .insert({
                user_id: user.id,
                google_access_token: providerToken,
                google_refresh_token: providerRefreshToken || null,
                whatsapp_enabled: true,
                email_enabled: true,
                pushover_enabled: true,
                telegram_enabled: true
              })
          }
        } catch (dbErr) {
          console.error("Failed to save provider token in callback:", dbErr)
        }
      }
      return NextResponse.redirect(
        `${origin}/dashboard` 
      )
    }
  }

  // Handle email confirmation
  if (token_hash && type === "email") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: "email",
    })
    if (!error) {
      return NextResponse.redirect(
        `${origin}/dashboard` 
      )
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=auth` 
  )
}
