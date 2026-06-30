"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState("")
  const [showEmail, setShowEmail] = useState(false)

  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: 
          `${window.location.origin}/auth/callback`,
        scopes: "email profile https://www.googleapis.com/auth/calendar.events",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        }
      },
    })
    if (error) {
      setMessage(error.message)
      setLoading(false)
    }
  }

  const handleEmailAuth = async () => {
    setLoading(true)
    setMessage("")
    
    if (isSignUp) {
      const { error } = await 
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 
              `${window.location.origin}/auth/callback` 
          }
        })
      if (error) setMessage(error.message)
      else setMessage(
        "Check your email for a confirmation link!"
      )
    } else {
      const { error } = await 
        supabase.auth.signInWithPassword({
          email,
          password,
        })
      if (error) setMessage(error.message)
      else window.location.href = "/dashboard"
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] premium-bg flex">
      {/* Left side - animated messages */}
      <div className="hidden lg:flex w-3/5 border-r border-white/[0.04] bg-grid flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Soft Radial Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, oklch(0.7 0.16 256 / 6%), transparent 65%)' }} />
        
        <div className="max-w-md space-y-8 relative z-10">
          <div className="text-4xl font-extrabold tracking-wider text-white flex items-center gap-1">
            NEXUS 
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4F9EFF] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4F9EFF]"></span>
            </span>
          </div>
          <p className="text-white/60 text-lg leading-relaxed font-medium">
            Your AI that knows when you are going to fail. And fixes it.
          </p>
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#4F9EFF]/20 to-transparent" />
            <p className="text-white/80 italic text-sm leading-relaxed">
              "NEXUS detected I was 68% likely to miss my deadline and fixed my plan automatically. I submitted 2 days early."
            </p>
            <p className="text-[#4F9EFF] text-xs font-semibold uppercase tracking-wider mt-4">— Priya S., CS Student</p>
          </div>
        </div>
      </div>

      {/* Right side - auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-grid lg:bg-none relative overflow-hidden">
        <div className="absolute inset-0 lg:hidden pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, oklch(0.7 0.16 256 / 4%), transparent 60%)' }} />
        <div className="w-full max-w-md glass-card rounded-2xl p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#4F9EFF]/30 to-transparent" />
          
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">Welcome to NEXUS</h1>
              <p className="text-white/45 text-sm mt-1.5">
                Sign in to start executing your goals
              </p>
            </div>

            {!showEmail ? (
              <div className="space-y-4">
                {/* Google button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-white/90 text-black font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-white/5 hover:-translate-y-0.5"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                    <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                    <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
                  </svg>
                  {loading ? "Connecting..." : "Continue with Google"}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/10"/>
                  <span className="text-white/30 text-xs uppercase tracking-wider font-semibold">or</span>
                  <div className="flex-1 h-px bg-white/10"/>
                </div>

                {/* Email button */}
                <button
                  onClick={() => setShowEmail(true)}
                  className="w-full bg-white/[0.02] border border-white/[0.06] hover:bg-white/5 text-white font-semibold py-3.5 px-4 rounded-xl transition-all cursor-pointer hover:-translate-y-0.5"
                >
                  Continue with Email
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.06] text-white placeholder-white/30 py-3.5 px-4 rounded-xl focus:outline-none focus:border-[#4F9EFF] focus:bg-white/[0.04] focus:ring-1 focus:ring-[#4F9EFF]/20 transition-all text-sm"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.06] text-white placeholder-white/30 py-3.5 px-4 rounded-xl focus:outline-none focus:border-[#4F9EFF] focus:bg-white/[0.04] focus:ring-1 focus:ring-[#4F9EFF]/20 transition-all text-sm"
                  />
                </div>

                <button
                  onClick={handleEmailAuth}
                  disabled={loading}
                  className="w-full bg-[#4F9EFF] hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/15 hover:-translate-y-0.5"
                >
                  {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
                </button>

                <div className="flex gap-2 text-xs justify-center pt-2">
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-[#4F9EFF] font-semibold hover:underline cursor-pointer"
                  >
                    {isSignUp ? "Already have an account?" : "Create new account"}
                  </button>
                  <span className="text-white/20">·</span>
                  <button
                    onClick={() => setShowEmail(false)}
                    className="text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    Back to Options
                  </button>
                </div>
              </div>
            )}

            {message && (
              <p className="text-center text-xs font-semibold text-[#4F9EFF] mt-2 animate-pulse">
                {message}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
