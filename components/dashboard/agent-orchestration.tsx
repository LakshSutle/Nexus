"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Terminal, Cpu, Play, CheckCircle, AlertTriangle, Shield, Calendar, RefreshCw } from "lucide-react"
import { StreamingTerminal } from "./streaming-terminal"

interface AgentNode {
  id: string
  name: string
  icon: string
  role: string
  status: "idle" | "processing" | "success" | "warning"
  description: string
  logs: string[]
}

export function AgentOrchestration({
  isAnalyzing,
  activeGoalTitle,
  activeGoalId,
  goalDescription,
  deadline,
  completionPct = 0,
  daysBehind = 0,
}: {
  isAnalyzing: boolean
  activeGoalTitle?: string
  activeGoalId?: string
  goalDescription?: string
  deadline?: string
  completionPct?: number
  daysBehind?: number
}) {
  const [selectedAgent, setSelectedAgent] = useState<string>("orchestrator")
  const [consoleLogs, setConsoleLogs] = useState<Array<{ id: string; agent: string; text: string; type: "info" | "success" | "warning" | "system"; time: string }>>([])
  const [agentStatuses, setAgentStatuses] = useState<Record<string, "idle" | "processing" | "success" | "warning">>({
    orchestrator: "idle",
    voice: "idle",
    scheduler: "idle",
    progress: "idle",
    predictor: "idle",
    intervention: "idle",
    replan: "idle",
    calendar: "idle",
    summary: "idle"
  })

  const logIndexRef = useRef(0)
  const consoleEndRef = useRef<HTMLDivElement>(null)

  const agents: Record<string, AgentNode> = {
    orchestrator: {
      id: "orchestrator",
      name: "Orchestrator Agent",
      icon: "🧠",
      role: "Central event director & state manager",
      status: agentStatuses.orchestrator,
      description: "Directs events, manages multi-agent handoffs, routes payloads, and persists system state variables to the PostgreSQL schema.",
      logs: [
        "Initializing state handshake...",
        "Orchestrating agent state sync: SUCCESS",
        "Listening for webhook event registers...",
        "Received intake callback: dispatching schedule build..."
      ]
    },
    voice: {
      id: "voice",
      name: "Voice Intake Agent",
      icon: "🎙️",
      role: "Natural speech layout parser",
      status: agentStatuses.voice,
      description: "Uses Web Speech API transcripts to run structured schema generation via Gemini 2.0 Flash, extracting milestones, deadlines, and daily hours.",
      logs: [
        "Speech recognition interface ready",
        "Audio streaming stream accepted",
        "Invoking Gemini 2.0 parser on voice transcription...",
        "Voice schema parsed: Title, Deadline, Hours mapped."
      ]
    },
    scheduler: {
      id: "scheduler",
      name: "Scheduling Agent",
      icon: "📅",
      role: "Task breakdown & sequence designer",
      status: agentStatuses.scheduler,
      description: "Decomposes high-level goals into chronological milestones and realistic daily tasks, optimizing sequence order based on available hours.",
      logs: [
        "Retrieving goal constraints...",
        "Decomposing goal into 4 main milestones...",
        "Calculating daily study task weights...",
        "Scheduling 15 tasks across target timeline: COMPLETED"
      ]
    },
    progress: {
      id: "progress",
      name: "Progress Tracking Agent",
      icon: "📊",
      role: "Velocity and milestone completion auditor",
      status: agentStatuses.progress,
      description: "Audits actual vs. target velocity, tracks daily task completions, and recalculates progress metrics dynamically.",
      logs: [
        "Auditing goal tasks complete ratio...",
        "Calculating actual vs. scheduled completion velocity...",
        "Milestone 1 progress: 32% complete",
        "Velocity metrics reported to Orchestrator."
      ]
    },
    predictor: {
      id: "predictor",
      name: "Failure Prediction Agent",
      icon: "🔮",
      role: "Execution failure forecaster",
      status: agentStatuses.predictor,
      description: "Predicts the probability of deadline failure by analyzing completion velocity gaps and remaining days using custom scoring models.",
      logs: [
        "Loading historical velocity trends...",
        "Running deadline failure forecast model...",
        "Detected task velocity gap of 1.2 tasks/day",
        "Calculated execution failure risk: 68% (WARNING)"
      ]
    },
    intervention: {
      id: "intervention",
      name: "Intervention Agent",
      icon: "🚨",
      role: "Risk resolver & rescue plan designer",
      status: agentStatuses.intervention,
      description: "Surfaces critical alarms when failure risks breach thresholds, creating actionable rescue recommendations for the user.",
      logs: [
        "Breached threshold (>50% risk): calculated 68% risk",
        "Generating rescue intervention plan...",
        "Adding recommendation: Reallocate 1h study time daily",
        "Pushing rescue card to dashboard UI."
      ]
    },
    replan: {
      id: "replan",
      name: "Replanning Agent",
      icon: "🔄",
      role: "Schedule adjustment optimizer",
      status: agentStatuses.replan,
      description: "Optimizes and regenerates schedule timelines when tasks are skipped, milestones change, or a rescue plan is accepted.",
      logs: [
        "Initiating dynamic schedule recalculation...",
        "Rebalancing remaining tasks across remaining days...",
        "Adjusting task sequence weights...",
        "New schedule built successfully."
      ]
    },
    calendar: {
      id: "calendar",
      name: "Google Calendar Agent",
      icon: "📅",
      role: "Google Calendar bi-directional sync",
      status: agentStatuses.calendar,
      description: "Retrieves user Supabase OAuth provider tokens and performs sync operations to publish tasks directly onto the user's calendar.",
      logs: [
        "Verifying Supabase user OAuth provider credentials...",
        "OAuth token validated successfully",
        "Syncing tasks to Google Calendar calendar feed...",
        "Calendar sync: 15 events published."
      ]
    },
    summary: {
      id: "summary",
      name: "Executive Summary Agent",
      icon: "📝",
      role: "Weekly performance reporter",
      status: agentStatuses.summary,
      description: "Aggregates workspace achievements, failure frequencies, and velocities to write comprehensive weekly executive analytics.",
      logs: [
        "Aggregating weekly task logs...",
        "Analyzing best performance day...",
        "Drafting executive summary content...",
        "Weekly performance report ready for dashboard."
      ]
    }
  }

  // Pre-seed mock log queue to simulate live multi-agent execution
  const baseLogQueue = [
    { agent: "orchestrator", text: "NEXUS Core Multi-Agent Kernel online. Version 2.0.1", type: "system" as const },
    { agent: "orchestrator", text: "Establishing secure supabase websocket channel...", type: "info" as const },
    { agent: "calendar", text: "OAuth API connector established: listening for calendar webhooks.", type: "info" as const },
    { agent: "predictor", text: "Periodic evaluation: checking goal execution health...", type: "info" as const },
    { agent: "progress", text: "Goal ID: Pass Data Structures: 7/19 tasks completed (37% completion).", type: "info" as const },
    { agent: "predictor", text: "Forecast model result: 10% failure probability. Health Score: 68.", type: "success" as const },
    { agent: "orchestrator", text: "System State: Healthy. Monitoring task loops.", type: "system" as const }
  ]

  const analysisLogQueue = [
    { agent: "orchestrator", text: `Triggered analysis pipeline for goal "${activeGoalTitle || 'Current Goal'}"`, type: "system" as const },
    { agent: "orchestrator", text: "Broadcasting event signal: EXECUTE_ANALYSIS", type: "system" as const },
    
    { agent: "progress", text: "Auditing current task velocities...", type: "info" as const },
    { agent: "progress", text: "Task logs: 7 completed, 12 remaining. Daily target: 2 tasks/day.", type: "info" as const },
    { agent: "progress", text: "Milestone status: Milestone 1 in progress (32% completion).", type: "info" as const },
    { agent: "progress", text: "Handoff to Failure Prediction Agent...", type: "success" as const },
    
    { agent: "predictor", text: "Evaluating remaining timeline: 12 days to deadline.", type: "info" as const },
    { agent: "predictor", text: "Calculated actual completion velocity: 1.1 tasks/day (Required: 1.5).", type: "warning" as const },
    { agent: "predictor", text: "Failure probability calculation complete. Forecasted failure risk: 68%.", type: "warning" as const },
    { agent: "predictor", text: "Handoff to Intervention Agent...", type: "warning" as const },
    
    { agent: "intervention", text: "Breached safety threshold (Risk > 50%). Raising CRITICAL flag.", type: "warning" as const },
    { agent: "intervention", text: "Generating custom recovery recommendations...", type: "info" as const },
    { agent: "intervention", text: "Generated recommendation: Adjust daily workload +0.5h.", type: "success" as const },
    { agent: "intervention", text: "Handoff to Google Calendar Agent...", type: "info" as const },
    
    { agent: "calendar", text: "Fetching user Google OAuth tokens...", type: "info" as const },
    { agent: "calendar", text: "Updating Google Calendar task events with risk indicators...", type: "info" as const },
    { agent: "calendar", text: "Google Calendar synced: 15 events updated.", type: "success" as const },
    
    { agent: "orchestrator", text: "Analysis pipeline completed. Dashboard state updated. All agents returned to standby.", type: "system" as const }
  ]

  // Initialize with base logs
  useEffect(() => {
    const initialLogs = baseLogQueue.map((log, index) => ({
      id: `init-${index}`,
      agent: agents[log.agent]?.name || "System",
      text: log.text,
      type: log.type,
      time: new Date(Date.now() - (7 - index) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }))
    setConsoleLogs(initialLogs)
  }, [])

  // Auto-scroll terminal
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [consoleLogs])

  // Handle active analysis state (fallback / scripted simulation if no real activeGoalId is provided)
  useEffect(() => {
    if (activeGoalId) {
      // If we have a real goal, we rely on StreamingTerminal events to set statuses
      return
    }

    if (isAnalyzing) {
      // Set all agents to processing/active sequentially
      setAgentStatuses({
        orchestrator: "processing",
        voice: "idle",
        scheduler: "idle",
        progress: "processing",
        predictor: "idle",
        intervention: "idle",
        replan: "idle",
        calendar: "idle",
        summary: "idle"
      })

      // Run animated log sequence
      logIndexRef.current = 0
      
      const interval = setInterval(() => {
        const nextLog = analysisLogQueue[logIndexRef.current]
        if (!nextLog) {
          clearInterval(interval)
          // Standby states
          setAgentStatuses({
            orchestrator: "success",
            voice: "idle",
            scheduler: "idle",
            progress: "success",
            predictor: "warning",
            intervention: "warning",
            replan: "idle",
            calendar: "success",
            summary: "success"
          })
          return
        }

        // Update active agent statuses based on logs
        setAgentStatuses(prev => {
          const next = { ...prev }
          if (nextLog.agent) {
            next[nextLog.agent] = nextLog.type === "warning" ? "warning" : nextLog.type === "success" ? "success" : "processing"
          }
          return next
        })

        setConsoleLogs(prev => [
          ...prev,
          {
            id: `analysis-${Date.now()}-${logIndexRef.current}`,
            agent: agents[nextLog.agent]?.name || "System",
            text: nextLog.text,
            type: nextLog.type,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        ])

        logIndexRef.current += 1
      }, 700)

      return () => clearInterval(interval)
    } else {
      setAgentStatuses({
        orchestrator: "idle",
        voice: "idle",
        scheduler: "idle",
        progress: "idle",
        predictor: "idle",
        intervention: "idle",
        replan: "idle",
        calendar: "idle",
        summary: "idle"
      })
    }
  }, [isAnalyzing, activeGoalId])

  const agentMap: Record<string, string> = {
    orchestrator: "orchestrator",
    scheduling: "scheduler",
    progress_tracking: "progress",
    intervention: "intervention",
    replanning: "replan",
  }

  const handleAgentActivated = (agentKey: string, index: number) => {
    const componentKey = agentMap[agentKey]
    if (!componentKey) return

    setAgentStatuses(prev => {
      const next = { ...prev }
      
      // Mark current agent as processing
      next[componentKey] = "processing"
      
      // Mark preceding agents as success
      const keys = ["orchestrator", "scheduling", "progress_tracking", "intervention", "replanning"]
      const currentIndex = keys.indexOf(agentKey)
      if (currentIndex > 0) {
        for (let i = 0; i < currentIndex; i++) {
          const prevCompKey = agentMap[keys[i]]
          if (prevCompKey) {
            next[prevCompKey] = "success"
          }
        }
      }
      
      // If intervention is active, progress and predictor must be completed
      if (agentKey === "intervention") {
        next.progress = "success"
        next.predictor = "success"
      }
      
      return next
    })

    setSelectedAgent(componentKey)
  }

  const handlePipelineComplete = () => {
    setAgentStatuses(prev => {
      const next = { ...prev }
      Object.values(agentMap).forEach(compKey => {
        next[compKey] = "success"
      })
      next.predictor = "success"
      next.calendar = "success"
      next.summary = "success"
      return next
    })
  }

  // Node layout coordinates inside our SVG coordinate space (800x400)
  const nodeCoords: Record<string, { x: number; y: number }> = {
    orchestrator: { x: 400, y: 200 },
    voice: { x: 400, y: 50 },
    scheduler: { x: 220, y: 100 },
    progress: { x: 150, y: 200 },
    predictor: { x: 220, y: 300 },
    intervention: { x: 580, y: 300 },
    replan: { x: 650, y: 200 },
    calendar: { x: 580, y: 100 },
    summary: { x: 400, y: 350 }
  }

  // Links to draw between Orchestrator and other agents
  const links = [
    { from: "orchestrator", to: "voice", bidirectional: true },
    { from: "orchestrator", to: "scheduler", bidirectional: false },
    { from: "orchestrator", to: "progress", bidirectional: true },
    { from: "orchestrator", to: "predictor", bidirectional: false },
    { from: "orchestrator", to: "intervention", bidirectional: false },
    { from: "orchestrator", to: "replan", bidirectional: true },
    { from: "orchestrator", to: "calendar", bidirectional: true },
    { from: "orchestrator", to: "summary", bidirectional: false }
  ]

  const getStatusBorder = (status: string) => {
    switch (status) {
      case "processing": return "border-blue-500 shadow-[0_0_15px_rgba(79,158,255,0.4)]"
      case "success": return "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
      case "warning": return "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
      default: return "border-white/10 dark:border-white/[0.05]"
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Node Graph Column */}
      <div className="lg:col-span-3 glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[420px]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#4F9EFF]/20 to-transparent" />
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#4F9EFF] animate-pulse" />
              NEXUS Core Neural Net
            </h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mt-0.5">
              9-Agent Multi-Agent Mesh Topology
            </p>
          </div>
          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Live Event Loop Active
          </span>
        </div>

        {/* Interactive SVG Mesh Canvas */}
        <div className="relative flex-1 bg-white/[0.01] dark:bg-black/20 rounded-xl border border-white/[0.02] dark:border-white/[0.03] overflow-hidden flex items-center justify-center p-4">
          <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
            {/* Draw link cables */}
            {links.map((link, idx) => {
              const start = nodeCoords[link.from]
              const end = nodeCoords[link.to]
              const isProcessing = agentStatuses[link.from] === "processing" || agentStatuses[link.to] === "processing" || isAnalyzing
              return (
                <g key={idx}>
                  <path
                    d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                    stroke={isProcessing ? "#4F9EFF" : "rgba(255, 255, 255, 0.05)"}
                    strokeWidth={isProcessing ? 1.5 : 1}
                    strokeDasharray={isProcessing ? "5 5" : "none"}
                    className={isProcessing ? "animate-[dash_10s_linear_infinite]" : ""}
                  />
                  {isProcessing && (
                    <motion.circle
                      r="3"
                      fill="#4F9EFF"
                      initial={{ offset: 0 }}
                      animate={{
                        cx: [start.x, end.x],
                        cy: [start.y, end.y],
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "linear",
                        delay: idx * 0.2
                      }}
                    />
                  )}
                </g>
              )
            })}
          </svg>

          {/* Render Interactive Nodes */}
          {Object.values(agents).map((agent) => {
            const coord = nodeCoords[agent.id]
            const isActive = selectedAgent === agent.id
            const status = agentStatuses[agent.id]

            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                style={{
                  position: "absolute",
                  left: `calc(${coord.x / 8}% - 22px)`,
                  top: `calc(${coord.y / 4}% - 22px)`,
                }}
                className={`size-11 rounded-xl bg-[#1e1e24] dark:bg-[#15151c]/90 border flex items-center justify-center text-lg transition-all duration-300 z-10 cursor-pointer ${getStatusBorder(status)} ${
                  isActive ? "scale-110 border-[#4F9EFF] ring-4 ring-[#4F9EFF]/10" : "hover:scale-105"
                }`}
              >
                <span>{agent.icon}</span>
                {status === "processing" && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 items-center justify-center text-[7px] text-white font-black">⚙️</span>
                  </span>
                )}
                {status === "success" && (
                  <span className="absolute -top-1 -right-1 size-3 bg-green-500 rounded-full border border-[#1e1e24] flex items-center justify-center text-[7px] text-white">✓</span>
                )}
                {status === "warning" && (
                  <span className="absolute -top-1 -right-1 size-3 bg-yellow-500 rounded-full border border-[#1e1e24] flex items-center justify-center text-[7px] text-black font-bold">!</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected Agent Inspector */}
        <div className="mt-4 bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5 flex items-start gap-3">
          <span className="text-2xl bg-white/[0.04] border border-white/[0.06] size-11 rounded-lg flex items-center justify-center shrink-0">
            {agents[selectedAgent].icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-xs text-white">{agents[selectedAgent].name}</h4>
              <span className="text-[9px] text-[#4F9EFF] bg-[#4F9EFF]/10 border border-[#4F9EFF]/20 font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                {agents[selectedAgent].role}
              </span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed mt-1">{agents[selectedAgent].description}</p>
          </div>
        </div>
      </div>

      {/* Live Thought Terminal Column */}
      <div className="lg:col-span-2 flex flex-col h-[420px]">
        <StreamingTerminal
          goalId={activeGoalId || ""}
          goalTitle={activeGoalTitle || ""}
          goalDescription={goalDescription}
          deadline={deadline}
          completionPct={completionPct}
          daysBehind={daysBehind}
          onAgentActivated={handleAgentActivated}
          onPipelineComplete={handlePipelineComplete}
          isAnalyzing={isAnalyzing}
          className="flex-1"
        />
      </div>
    </div>
  )
}
