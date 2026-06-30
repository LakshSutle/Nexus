"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MessageSquare,
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Bell,
  Send,
} from "lucide-react";

export type ToastType = "success" | "warning" | "error" | "info";

export interface ChannelResult {
  channel: "calendar" | "whatsapp" | "email" | "pushover" | "telegram";
  success: boolean;
  message?: string;
}

export interface ToastData {
  type: ToastType;
  title: string;
  message?: string;
  channels?: ChannelResult[];
}

const CHANNEL_CONFIG = {
  calendar: {
    icon: Calendar,
    label: "Google Calendar",
    color: "blue",
    bg: "bg-blue-500/15",
    border: "border-blue-500/25",
    text: "text-blue-400",
    glow: "shadow-blue-500/10",
    successBg: "bg-blue-500/10",
    failBg: "bg-red-500/10",
  },
  whatsapp: {
    icon: MessageSquare,
    label: "WhatsApp",
    color: "green",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/25",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/10",
    successBg: "bg-emerald-500/10",
    failBg: "bg-red-500/10",
  },
  email: {
    icon: Mail,
    label: "Email",
    color: "purple",
    bg: "bg-purple-500/15",
    border: "border-purple-500/25",
    text: "text-purple-400",
    glow: "shadow-purple-500/10",
    successBg: "bg-purple-500/10",
    failBg: "bg-red-500/10",
  },
  pushover: {
    icon: Bell,
    label: "Pushover",
    color: "orange",
    bg: "bg-orange-500/15",
    border: "border-orange-500/25",
    text: "text-orange-400",
    glow: "shadow-orange-500/10",
    successBg: "bg-orange-500/10",
    failBg: "bg-red-500/10",
  },
  telegram: {
    icon: Send,
    label: "Telegram",
    color: "sky",
    bg: "bg-sky-500/15",
    border: "border-sky-500/25",
    text: "text-sky-400",
    glow: "shadow-sky-500/10",
    successBg: "bg-sky-500/10",
    failBg: "bg-red-500/10",
  },
};


const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    accentColor: "from-emerald-500 to-teal-500",
    borderColor: "border-emerald-500/20",
    bgGlow: "bg-emerald-500/5",
    iconColor: "text-emerald-400",
    barColor: "bg-emerald-500",
  },
  warning: {
    icon: AlertTriangle,
    accentColor: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/20",
    bgGlow: "bg-amber-500/5",
    iconColor: "text-amber-400",
    barColor: "bg-amber-500",
  },
  error: {
    icon: XCircle,
    accentColor: "from-red-500 to-rose-500",
    borderColor: "border-red-500/20",
    bgGlow: "bg-red-500/5",
    iconColor: "text-red-400",
    barColor: "bg-red-500",
  },
  info: {
    icon: Info,
    accentColor: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/20",
    bgGlow: "bg-blue-500/5",
    iconColor: "text-blue-400",
    barColor: "bg-blue-500",
  },
};

const AUTO_DISMISS_MS = 6000;

interface ToastNotificationProps {
  toast: ToastData | string | null;
  onDismiss: () => void;
}

export function ToastNotification({ toast, onDismiss }: ToastNotificationProps) {
  const [progress, setProgress] = useState(100);

  // Normalize string toasts to ToastData
  const data: ToastData | null = toast
    ? typeof toast === "string"
      ? { type: inferType(toast), title: toast }
      : toast
    : null;

  useEffect(() => {
    if (!data) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [data, onDismiss]);

  const typeConfig = data ? TYPE_CONFIG[data.type] : TYPE_CONFIG.info;
  const TypeIcon = typeConfig.icon;

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="fixed top-5 right-5 z-[9999] w-[380px] max-w-[calc(100vw-40px)]"
        >
          <div
            className={`relative overflow-hidden rounded-2xl border ${typeConfig.borderColor} bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-black/40`}
          >
            {/* Top gradient accent line */}
            <div
              className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${typeConfig.accentColor}`}
            />

            {/* Content */}
            <div className="p-4">
              {/* Header row */}
              <div className="flex items-start gap-3">
                <div
                  className={`shrink-0 mt-0.5 size-8 rounded-xl ${typeConfig.bgGlow} border border-white/[0.06] flex items-center justify-center`}
                >
                  <TypeIcon className={`w-4 h-4 ${typeConfig.iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white leading-snug">
                    {data.title}
                  </p>
                  {data.message && (
                    <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">
                      {data.message}
                    </p>
                  )}
                </div>

                <button
                  onClick={onDismiss}
                  className="shrink-0 size-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-white/40" />
                </button>
              </div>

              {/* Channel results */}
              {data.channels && data.channels.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {data.channels.map((ch, i) => {
                    const config = CHANNEL_CONFIG[ch.channel] || CHANNEL_CONFIG.email;
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={ch.channel}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${
                          ch.success
                            ? `${config.successBg} ${config.border}`
                            : "bg-red-500/[0.06] border-red-500/15"
                        }`}
                      >
                        <div
                          className={`size-6 rounded-lg flex items-center justify-center ${
                            ch.success ? config.bg : "bg-red-500/15"
                          }`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 ${
                              ch.success ? config.text : "text-red-400"
                            }`}
                          />
                        </div>

                        <span className="flex-1 text-[12px] font-medium text-white/80">
                          {config.label}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {ch.success ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[11px] font-medium text-emerald-400">
                                Sent
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-red-400" />
                              <span className="text-[11px] font-medium text-red-400 truncate max-w-[100px]">
                                {ch.message || "Failed"}
                              </span>
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-[2px] bg-white/[0.04]">
              <motion.div
                className={`h-full ${typeConfig.barColor}`}
                initial={{ width: "100%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.03, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Infer toast type from emoji prefix for backward-compatible string toasts */
function inferType(msg: string): ToastType {
  if (msg.startsWith("✅") || msg.startsWith("🎉")) return "success";
  if (msg.startsWith("⚠️")) return "warning";
  if (msg.startsWith("❌")) return "error";
  return "info";
}
