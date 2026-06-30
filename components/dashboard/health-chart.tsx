"use client"

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ReferenceLine
} from "recharts"
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"

interface HealthChartProps {
  data: any[]
}

export default function HealthChart({ data }: HealthChartProps) {
  // If no data or single data point, construct a mock sequence for the demo
  const snapshots = data && data.length > 1 ? data : [
    { date: "Jun 20", health: 40, velocity: 0.8 },
    { date: "Jun 21", health: 45, velocity: 0.9 },
    { date: "Jun 22", health: 50, velocity: 1.0 },
    { date: "Jun 23", health: 52, velocity: 1.1 },
    { date: "Jun 24", health: 58, velocity: 1.2 },
    { date: "Jun 25", health: 65, velocity: 1.25 },
    { date: "Jun 26", health: 68, velocity: 1.28 }
  ]

  // Calculate actual metrics
  const lastSnap = snapshots[snapshots.length - 1]
  const currentProgress = lastSnap.health
  const actualVelocity = lastSnap.velocity || 1.2
  const requiredVelocity = 1.5 // Target velocity needed to finish on time
  const isOnTrack = actualVelocity >= requiredVelocity

  // Extrapolate forecast points into the future
  const chartData = snapshots.map((s, idx) => {
    // Target is a straight slope line from 20% to 100% across the timeline
    const targetVal = Math.round(20 + (idx / (snapshots.length - 1)) * 80)
    return {
      date: s.date,
      target: targetVal,
      actual: s.health,
      forecast: null as number | null
    }
  })

  // Add 3 forecast data points projecting into the future
  const lastDateStr = lastSnap.date
  const futureDays = ["In 3 Days", "In 6 Days", "In 10 Days"]
  
  // Forecast projection slope based on current velocity
  let runningForecast = currentProgress
  
  futureDays.forEach((day, idx) => {
    const slopeModifier = actualVelocity / requiredVelocity
    // Project growth: base growth is 10 units per interval, scaled by velocity ratio
    const step = 10 * slopeModifier
    runningForecast = Math.min(100, Math.round(runningForecast + step))
    
    // Target line continues at 100% once it reaches the deadline
    chartData.push({
      date: day,
      target: 100,
      actual: null as any,
      forecast: idx === 0 ? currentProgress : runningForecast
    })
  })

  return (
    <div className="space-y-4">
      {/* Forecast Engine HUD Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-primary/[0.03] border border-primary/[0.08] rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className={`size-9 rounded-xl flex items-center justify-center border ${
            isOnTrack 
              ? "bg-green-500/10 border-green-500/20 text-green-400" 
              : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
          }`}>
            {isOnTrack ? <CheckCircle className="size-4.5" /> : <AlertTriangle className="size-4.5" />}
          </div>
          <div>
            <p className="text-xs font-bold text-foreground leading-none">
              {isOnTrack ? "Velocity Sustainable" : "Velocity Deficit Detected"}
            </p>
            <p className="text-[10px] text-muted-foreground font-semibold mt-1">
              Projected Finish: {isOnTrack ? "2 Days Before Deadline" : "3 Days Late (Replanning Recommended)"}
            </p>
          </div>
        </div>

        <div className="flex gap-4 text-right">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Actual Velocity</p>
            <p className="text-sm font-extrabold text-foreground">{actualVelocity.toFixed(1)} <span className="text-[10px] text-muted-foreground font-normal">tasks/day</span></p>
          </div>
          <div className="border-l border-primary/[0.1] pl-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Required Pace</p>
            <p className="text-sm font-extrabold text-primary">{requiredVelocity.toFixed(1)} <span className="text-[10px] text-primary/60 font-normal">tasks/day</span></p>
          </div>
        </div>
      </div>

      {/* Recharts Forecast Graph */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--nx-amber)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--nx-amber)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'var(--chart-tick)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: 'var(--chart-tick)' }}
              axisLine={false}
              tickLine={false}
              width={25}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--chart-tooltip-bg)',
                border: '1px solid var(--chart-tooltip-border)',
                borderRadius: '12px',
                fontSize: '10px',
                backdropFilter: 'blur(8px)',
                color: 'var(--chart-tooltip-text)'
              }}
            />
            
            {/* Today vertical divider line */}
            <ReferenceLine x="Jun 26" stroke="var(--border)" strokeDasharray="3 3" />

            {/* Target trajectory path */}
            <Line
              type="monotone"
              dataKey="target"
              stroke="var(--border)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="Target Pace"
            />

            {/* Actual progress path area */}
            <Area
              type="monotone"
              dataKey="actual"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#actualGradient)"
              name="Actual Progress"
            />

            {/* Extrapolated forecast path line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="var(--nx-amber)"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={true}
              name="Projected Forecast"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
