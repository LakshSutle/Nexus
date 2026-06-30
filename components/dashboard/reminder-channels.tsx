"use client";

import { useState, useEffect } from "react";
import { Bell, Calendar, MessageSquare, ShieldAlert, Check } from "lucide-react";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase";
import type { ToastData, ChannelResult } from "@/components/ui/toast-notification";

interface ReminderChannelProps {
  onTriggerTestAlert: (data: ToastData) => void;
}

export function ReminderChannels({ onTriggerTestAlert }: ReminderChannelProps) {
  const [channels, setChannels] = useState({
    calendar: false,
    whatsapp: true,
    pushover: false,
    telegram: false,
    email: false,
  });

  const [testing, setTesting] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const res = await api.getSettings(user.id);
        if (res.settings) {
          setChannels({
            calendar: !!res.settings.google_calendar_enabled,
            whatsapp: !!res.settings.whatsapp_enabled,
            pushover: false,
            telegram: false,
            email: false,
          });
        }
      } catch (err) {
        console.error("Failed to load settings in channels panel:", err);
      }
    }
    loadSettings();
  }, []);

  const toggleChannel = async (key: keyof typeof channels) => {
    const updatedVal = !channels[key];
    setChannels((prev) => ({
      ...prev,
      [key]: updatedVal,
    }));

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload: any = {};
      if (key === "calendar") payload.google_calendar_enabled = updatedVal;
      if (key === "whatsapp") payload.whatsapp_enabled = updatedVal;

      await api.updateSettings(user.id, payload);
    } catch (err) {
      console.error("Failed to update settings channel toggle:", err);
    }
  };

  const handleTestAlert = async () => {
    setTesting(true);
    try {
      const activeKeys = Object.entries(channels)
        .filter(([_, active]) => active)
        .map(([name]) => name) as ("calendar" | "whatsapp" | "pushover" | "telegram" | "email")[];

      if (activeKeys.length === 0) {
        onTriggerTestAlert({
          type: "warning",
          title: "No channels selected",
          message: "Enable at least one reminder channel to send a test alert.",
        });
        setTesting(false);
        return;
      }

      // Get user session for provider_token and email
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = session?.provider_token;
      const userEmail = session?.user?.email;
      const userId = session?.user?.id;

      const results: ChannelResult[] = [];

      for (const ch of activeKeys) {
        try {
          const body: { access_token?: string; user_email?: string; user_id?: string } = {};
          if (userId) body.user_id = userId;
          if (ch === "calendar") body.access_token = providerToken || undefined;
          if (ch === "email") body.user_email = userEmail || undefined;

          const res = await api.triggerTestAlert(ch, body);
          results.push({
            channel: ch,
            success: !!res.success,
            message: res.reason || res.message,
          });
        } catch (err: any) {
          results.push({
            channel: ch,
            success: false,
            message: err.message || "Request failed",
          });
        }
      }

      const allSuccess = results.every((r) => r.success);
      const allFailed = results.every((r) => !r.success);

      onTriggerTestAlert({
        type: allSuccess ? "success" : allFailed ? "error" : "warning",
        title: allSuccess
          ? "All channels active"
          : allFailed
          ? "Alert delivery failed"
          : "Partial delivery",
        message: allSuccess
          ? "Test alerts were sent to all active channels."
          : "Some channels encountered issues.",
        channels: results,
      });
    } catch (error: any) {
      onTriggerTestAlert({
        type: "error",
        title: "Test failed",
        message: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-full min-h-[220px]">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#4F9EFF]/30 to-transparent" />
      
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#4F9EFF] animate-pulse" />
            Reminders & Channels
          </h3>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mt-0.5">
            Active Outreach Orchestration
          </p>
        </div>

        {/* Channels List */}
        <div className="space-y-3">
          {/* Calendar channel */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">Google Calendar</p>
                <p className="text-[9px] text-white/40 truncate">Email (60m) & Popup (15m)</p>
              </div>
            </div>
            <button
              onClick={() => toggleChannel("calendar")}
              className={`size-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                channels.calendar
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                  : "bg-white/5 border-white/10 text-white/30"
              }`}
            >
              {channels.calendar ? <Check className="w-4 h-4" /> : <div className="size-2 rounded-full bg-white/20" />}
            </button>
          </div>

          {/* WhatsApp channel */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">WhatsApp Outreach</p>
                <p className="text-[9px] text-white/40 truncate">Auto-reschedule alerts on risk</p>
              </div>
            </div>
            <button
              onClick={() => toggleChannel("whatsapp")}
              className={`size-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                channels.whatsapp
                  ? "bg-green-500/20 border-green-500/40 text-green-400"
                  : "bg-white/5 border-white/10 text-white/30"
              }`}
            >
              {channels.whatsapp ? <Check className="w-4 h-4" /> : <div className="size-2 rounded-full bg-white/20" />}
            </button>
          </div>
        </div>
      </div>

      {/* Trigger Test Button */}
      <button
        onClick={handleTestAlert}
        disabled={testing}
        className="w-full mt-4 bg-primary/10 hover:bg-primary/20 text-[#4F9EFF] border border-primary/25 hover:border-primary/45 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {testing ? (
          <>
            <div className="size-3.5 border border-primary/30 border-t-primary rounded-full animate-spin" />
            Broadcasting...
          </>
        ) : (
          <>
            <ShieldAlert className="w-3.5 h-3.5" />
            Send Test Alert
          </>
        )}
      </button>
    </div>
  );
}
