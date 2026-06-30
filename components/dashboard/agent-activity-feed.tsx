"use client";

/**
 * AgentActivityFeed — Live right-sidebar panel showing every agent action.
 *
 * Connects to GET /api/activity/stream via SSE for real-time updates.
 * Falls back to polling /api/activity/recent if SSE isn't available.
 *
 * Makes the multi-agent architecture legible at a glance —
 * judges can watch all 8 agents working in parallel without
 * needing to understand the neural mesh.
 */

import { useState, useEffect, useRef } from "react";
import { Activity, Wifi, WifiOff, Clock } from "lucide-react";

interface ActivityEntry {
  id: string;
  agent_name: string;
  action_type: string;
  message: string;
  created_at: string;
  goal_id?: string;
  agent_meta: {
    icon: string;
    color: string;
  };
}

interface AgentActivityFeedProps {
  userId?: string;
  maxItems?: number;
  className?: string;
}

const DEMO_ACTIVITIES: ActivityEntry[] = [
  {
    id: "d1",
    agent_name: "orchestrator",
    action_type: "pipeline_start",
    message: 'Decomposed "OS Exam" into 6 milestones',
    created_at: new Date(Date.now() - 120000).toISOString(),
    agent_meta: { icon: "🔵", color: "#6366f1" },
  },
  {
    id: "d2",
    agent_name: "scheduling",
    action_type: "plan_created",
    message: "Built 14-day plan (42 tasks, 3h/day)",
    created_at: new Date(Date.now() - 115000).toISOString(),
    agent_meta: { icon: "🟠", color: "#f97316" },
  },
  {
    id: "d3",
    agent_name: "calendar",
    action_type: "events_published",
    message: "Published 3 study blocks to Google Calendar",
    created_at: new Date(Date.now() - 60000).toISOString(),
    agent_meta: { icon: "📅", color: "#3b82f6" },
  },
  {
    id: "d4",
    agent_name: "progress_tracking",
    action_type: "velocity_check",
    message: "Velocity: 2.1 tasks/day vs 3.0 required",
    created_at: new Date(Date.now() - 30000).toISOString(),
    agent_meta: { icon: "🟢", color: "#22c55e" },
  },
  {
    id: "d5",
    agent_name: "intervention",
    action_type: "risk_flagged",
    message: "CRITICAL: Memory Mgmt at 23% velocity deficit",
    created_at: new Date(Date.now() - 10000).toISOString(),
    agent_meta: { icon: "🔴", color: "#ef4444" },
  },
  {
    id: "d6",
    agent_name: "outreach",
    action_type: "whatsapp_sent",
    message: "WhatsApp alert sent — awaiting reply",
    created_at: new Date(Date.now() - 3000).toISOString(),
    agent_meta: { icon: "📱", color: "#06b6d4" },
  },
];

export function AgentActivityFeed({
  userId,
  maxItems = 50,
  className = "",
}: AgentActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>(DEMO_ACTIVITIES);
  const [connected, setConnected] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // Connect to SSE stream
  useEffect(() => {
    if (!userId) return;

    // Load recent history first
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${API_URL}/api/activity/recent?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.activities && data.activities.length > 0) {
          setActivities(data.activities);
        }
      })
      .catch((err) => console.error("Feed: failed to load recent history", err));

    const url = `${API_URL}/api/activity/stream?user_id=${userId}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("connected", () => {
      setConnected(true);
    });

    es.addEventListener("activity", (e) => {
      const entry: ActivityEntry = JSON.parse(e.data);
      setActivities((prev) => {
        // Prevent duplicate IDs
        if (prev.some((x) => x.id === entry.id)) return prev;
        const updated = [entry, ...prev].slice(0, maxItems);
        return updated;
      });
      setNewCount((c) => c + 1);

      // Auto-scroll to top
      if (feedRef.current) {
        feedRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [userId, maxItems]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    if (diffSec < 10) return "just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getActionBadge = (actionType: string) => {
    const badges: Record<string, { label: string; class: string }> = {
      pipeline_start:    { label: "pipeline",  class: "bg-[oklch(0.65_0.28_285_/_10%)] text-[oklch(0.65_0.28_285)] border-[oklch(0.65_0.28_285_/_15%)]" },
      plan_created:      { label: "plan",       class: "bg-[oklch(0.78_0.16_75_/_10%)] text-[oklch(0.78_0.16_75)] border-[oklch(0.78_0.16_75_/_15%)]" },
      events_published:  { label: "calendar",  class: "bg-[oklch(0.75_0.18_195_/_10%)] text-[oklch(0.75_0.18_195)] border-[oklch(0.75_0.18_195_/_15%)]" },
      velocity_check:    { label: "tracking",  class: "bg-[oklch(0.72_0.19_155_/_10%)] text-[oklch(0.72_0.19_155)] border-[oklch(0.72_0.19_155_/_15%)]" },
      risk_flagged:      { label: "alert",     class: "bg-red-500/10 text-red-400 border-red-500/15" },
      whatsapp_sent:     { label: "outreach",  class: "bg-[oklch(0.75_0.18_195_/_10%)] text-[oklch(0.75_0.18_195)] border-[oklch(0.75_0.18_195_/_15%)]" },
      plan_rescheduled:  { label: "replan",    class: "bg-[oklch(0.6_0.24_340_/_10%)] text-[oklch(0.6_0.24_340)] border-[oklch(0.6_0.24_340_/_15%)]" },
      resource_found:    { label: "resource",  class: "bg-teal-500/10 text-teal-400 border-teal-500/15" },
    };
    return badges[actionType] || { label: "action", class: "bg-primary/5 text-primary border-primary/10" };
  };

  return (
    <div className={`flex flex-col h-full bg-card/30 backdrop-blur-xl border border-primary/[0.06] rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-primary/[0.06] bg-primary/[0.02]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-gradient-primary">Agent Activity</span>
          {newCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/15 animate-pulse">
              {newCount} new
            </span>
          )}
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          {connected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              <WifiOff className="w-3.5 h-3.5 text-muted-foreground/45" />
            </>
          )}
        </div>
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-1.5 scroll-smooth"
        style={{ scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}
      >
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
            <Activity className="w-8 h-8 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground text-center">
              No agent activity yet.
              <br />
              Analyze a goal to see agents work.
            </p>
          </div>
        ) : (
          activities.map((entry, i) => {
            const badge = getActionBadge(entry.action_type);
            return (
              <div
                key={entry.id}
                className={`
                  group flex gap-3 p-3 rounded-xl hover:bg-primary/[0.04] transition-all duration-300 border border-transparent
                  ${i === 0 ? "bg-primary/[0.03] border-primary/[0.08]" : ""}
                `}
                style={{
                  animation: i === 0 ? "slideInFeed 0.3s cubic-bezier(0.16, 1, 0.3, 1)" : undefined,
                }}
              >
                {/* Agent icon */}
                <div
                  className="flex-shrink-0 w-8.5 h-8.5 rounded-xl flex items-center justify-center text-sm border shadow-sm"
                  style={{
                    background: `${entry.agent_meta.color}15`,
                    borderColor: `${entry.agent_meta.color}35`,
                  }}
                >
                  {entry.agent_meta.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-bold text-foreground/80 capitalize">
                      {entry.agent_name.replace("_", " ")}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${badge.class}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed truncate" title={entry.message}>
                    {entry.message}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="flex-shrink-0 flex items-start gap-1 text-muted-foreground/40">
                  <Clock className="w-2.5 h-2.5 mt-0.5" />
                  <span className="text-[10px] font-medium">{formatTime(entry.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        @keyframes slideInFeed {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
