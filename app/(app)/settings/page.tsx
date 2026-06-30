"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase"
import { api } from "@/lib/api"
import {
  Settings, MessageSquare, Mail, Phone, Shield,
  Save, Loader2, CheckCircle2, ArrowLeft, Bell,
  ToggleLeft, ToggleRight, Smartphone, Send, AlertTriangle, Watch,
  Brain, Key, Calendar
} from "lucide-react"
import { useRouter } from "next/navigation"
import { ToastNotification } from "@/components/ui/toast-notification"
import type { ToastData } from "@/components/ui/toast-notification"

interface UserSettings {
  whatsapp_number: string
  notification_email: string
  whatsapp_enabled: boolean
  email_enabled: boolean
  pushover_user_key: string
  pushover_enabled: boolean
  telegram_chat_id: string
  telegram_enabled: boolean
  gemini_api_key: string
  google_calendar_enabled: boolean
}

const defaultSettings: UserSettings = {
  whatsapp_number: "",
  notification_email: "",
  whatsapp_enabled: true,
  email_enabled: true,
  pushover_user_key: "",
  pushover_enabled: true,
  telegram_chat_id: "",
  telegram_enabled: true,
  gemini_api_key: "",
  google_calendar_enabled: false,
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [originalSettings, setOriginalSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastData | string | null>(null)
  const dismissToast = useCallback(() => setToast(null), [])
  const [userId, setUserId] = useState<string | null>(null)

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings)

  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)

        const res = await api.getSettings(user.id)
        if (res.settings) {
          const loaded = {
            whatsapp_number: res.settings.whatsapp_number || "",
            notification_email: res.settings.notification_email || user.email || "",
            whatsapp_enabled: res.settings.whatsapp_enabled ?? true,
            email_enabled: res.settings.email_enabled ?? true,
            pushover_user_key: res.settings.pushover_user_key || "",
            pushover_enabled: res.settings.pushover_enabled ?? true,
            telegram_chat_id: res.settings.telegram_chat_id || "",
            telegram_enabled: res.settings.telegram_enabled ?? true,
            gemini_api_key: res.settings.gemini_api_key || "",
            google_calendar_enabled: res.settings.google_calendar_enabled ?? false,
          }
          setSettings(loaded)
          setOriginalSettings(loaded)
        }
      } catch (err) {
        console.error("Failed to load settings:", err)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const saveSettings = async () => {
    if (!userId || saving) return

    setSaving(true)
    try {
      await api.updateSettings(userId, settings)
      setOriginalSettings({ ...settings })
      setToast({
        type: "success",
        title: "Settings saved",
        message: "Your notification preferences have been updated."
      })
    } catch (err) {
      console.error("Failed to save settings:", err)
      setToast({
        type: "error",
        title: "Failed to save",
        message: "Something went wrong. Please try again."
      })
    } finally {
      setSaving(false)
    }
  }

  const sendTestAlert = async (channel: "whatsapp" | "email" | "pushover" | "telegram") => {
    setTesting(channel)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const body: Record<string, string> = {}
      if (userId) body.user_id = userId
      if (session?.provider_token) body.access_token = session.provider_token
      if (settings.notification_email) body.user_email = settings.notification_email

      const res = await api.triggerTestAlert(channel, body)

      if (res.success) {
        setToast({
          type: "success",
          title: `Test ${channel === "whatsapp" ? "WhatsApp" : channel === "pushover" ? "Pushover" : channel === "telegram" ? "Telegram" : "email"} sent!`,
          message: channel === "whatsapp"
            ? `Check your WhatsApp on ${settings.whatsapp_number || "the configured number"}`
            : channel === "pushover"
            ? `Check your Pushover app / smartwatch!`
            : channel === "telegram"
            ? `Check your Telegram chat / watch!`
            : `Check your inbox at ${settings.notification_email}`
        })
      } else {
        setToast({
          type: "error",
          title: `Test ${channel} failed`,
          message: res.reason || "Unknown error"
        })
      }
    } catch (err: any) {
      setToast({
        type: "error",
        title: `Test ${channel} failed`,
        message: err.message || "Network error"
      })
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 md:p-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary relative">
              <div className="absolute inset-0 rounded-xl bg-primary/12 blur-md opacity-60" />
              <Settings className="size-5 relative z-10" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-xs text-muted-foreground">Notification preferences & channels</p>
            </div>
          </div>
        </div>

        {/* Notification Channels */}
        <div className="space-y-6">

          {/* WhatsApp Section */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/[0.06] dark:border-white/[0.04] bg-card/30 dark:bg-white/[0.02] backdrop-blur-xl">
            {/* Accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/60 via-green-500/40 to-transparent" />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <MessageSquare className="w-4.5 h-4.5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-bold">WhatsApp Notifications</h2>
                  <p className="text-[11px] text-muted-foreground">Get proactive alerts via Twilio WhatsApp</p>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, whatsapp_enabled: !s.whatsapp_enabled }))}
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  aria-label="Toggle WhatsApp notifications"
                >
                  {settings.whatsapp_enabled ? (
                    <ToggleRight className="w-9 h-9 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-muted-foreground/40" />
                  )}
                </button>
              </div>

              {/* Phone Number Input */}
              <AnimatePresence>
                {settings.whatsapp_enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      WhatsApp Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <input
                        type="tel"
                        value={settings.whatsapp_number}
                        onChange={(e) => setSettings(s => ({ ...s, whatsapp_number: e.target.value }))}
                        placeholder="+91XXXXXXXXXX"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-background/50 dark:bg-white/[0.03] border border-primary/[0.08] dark:border-white/[0.06] text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all"
                      />
                    </div>
                    {/* Sandbox Activation Banner */}
                    <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 mt-0.5">
                          <Smartphone className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-amber-300 mb-1.5">⚡ Activate WhatsApp (Required)</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mb-2.5">
                            To receive NEXUS alerts, you must first activate your number with the Twilio sandbox.
                            Open WhatsApp on your phone and send the following message:
                          </p>
                          <div className="flex items-center gap-2 bg-black/20 dark:bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2 mb-2.5">
                            <code className="text-sm font-mono font-bold text-emerald-400 select-all flex-1">
                              join rubbed-fighting
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText("join rubbed-fighting")
                                setToast({ type: "success", title: "Copied to clipboard!" })
                              }}
                              className="text-[10px] text-muted-foreground hover:text-foreground bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] px-2 py-1 rounded-md transition-all cursor-pointer font-medium"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Send it to this number on WhatsApp:
                          </p>
                          <div className="flex items-center gap-2 bg-black/20 dark:bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2 mt-1.5">
                            <code className="text-sm font-mono font-bold text-blue-400 select-all flex-1">
                              +1 (415) 523-8886
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText("+14155238886")
                                setToast({ type: "success", title: "Number copied!" })
                              }}
                              className="text-[10px] text-muted-foreground hover:text-foreground bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] px-2 py-1 rounded-md transition-all cursor-pointer font-medium"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-[10px] text-muted-foreground/60 mt-2">
                            Once you receive a confirmation reply, you&apos;re all set!
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground/60 mt-3 flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-amber-400/70" />
                      Include country code (e.g. +91). Each number must activate separately.
                    </p>

                    {/* Test Button */}
                    <button
                      onClick={() => sendTestAlert("whatsapp")}
                      disabled={!settings.whatsapp_number || testing === "whatsapp"}
                      className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {testing === "whatsapp" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Send test WhatsApp
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>


          {/* Google Calendar Sync Master Toggle */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/[0.06] dark:border-white/[0.04] bg-card/30 dark:bg-white/[0.02] backdrop-blur-xl">
            {/* Accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/60 via-indigo-500/40 to-transparent" />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="size-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Calendar className="w-4.5 h-4.5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-bold">Google Calendar Sync</h2>
                  <p className="text-[11px] text-muted-foreground">Automatically sync your task schedules and milestones to your Google Calendar</p>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, google_calendar_enabled: !s.google_calendar_enabled }))}
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  aria-label="Toggle Google Calendar sync"
                >
                  {settings.google_calendar_enabled ? (
                    <ToggleRight className="w-9 h-9 text-blue-400" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-muted-foreground/40" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/60 flex items-start gap-1.5 leading-relaxed">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" />
                <span>
                  <b>Safety Sync Switch</b>: Keep this toggle OFF unless you have verified that your local Google OAuth token is fresh. If disabled, calendar sync is bypassed to prevent rate limits or silent OAuth expiry failures during the demo.
                </span>
              </p>
            </div>
          </div>

          {/* Gemini API Key Section */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/[0.06] dark:border-white/[0.04] bg-card/30 dark:bg-white/[0.02] backdrop-blur-xl">
            {/* Accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/60 via-indigo-500/40 to-transparent" />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="size-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Brain className="w-4.5 h-4.5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-bold">Gemini API Key</h2>
                  <p className="text-[11px] text-muted-foreground">Use your own Gemini API key for goal planning and analysis</p>
                </div>
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Gemini API Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="password"
                    value={settings.gemini_api_key}
                    onChange={(e) => setSettings(s => ({ ...s, gemini_api_key: e.target.value }))}
                    placeholder="AIzaSy..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-background/50 dark:bg-white/[0.03] border border-primary/[0.08] dark:border-white/[0.06] text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all font-mono"
                  />
                </div>
                
                <p className="text-[10px] text-muted-foreground/60 mt-3 flex items-start gap-1.5 leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" />
                  If left blank, NEXUS will use the global server key. Setting your own key prevents 429 Quota Exceeded errors during intensive goal orchestration.
                </p>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="rounded-2xl border border-primary/[0.06] dark:border-white/[0.04] bg-primary/[0.02] dark:bg-white/[0.01] p-5">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground/80 mb-1">How NEXUS uses notifications</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  NEXUS agents autonomously monitor your goals. When the Failure Prediction Agent detects you&apos;re falling behind,
                  the Outreach Agent sends you a proactive alert — no need to open the app. You stay in the loop, always.
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div>
            <button
              onClick={saveSettings}
              disabled={!hasChanges || saving}
              className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                hasChanges
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
                  : "bg-primary/10 text-primary/40 cursor-not-allowed"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : hasChanges ? (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  All changes saved
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <ToastNotification toast={toast} onDismiss={dismissToast} />
    </div>
  )
}
