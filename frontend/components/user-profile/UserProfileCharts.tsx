"use client"

import * as React from "react"
import styles from "./user-profile.module.css"
import { UserProfileCard } from "./UserProfileCards"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"
import {
  getDashboardChart,
  getEnergyPointsHeatmapData,
  getEnergyPointsPercentageChartData,
} from "@/lib/api/user-profile"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { format } from "date-fns"

function buildDailySeries(
  dataPoints: Record<string, number>,
  year: number
): Array<{ date: string; points: number }> {
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  const byDay = new Map<string, number>()

  // Frappe returns dict of { unix_day_timestamp: sum(points) } (seconds)
  for (const [k, v] of Object.entries(dataPoints || {})) {
    const ts = Number(k)
    if (!Number.isFinite(ts)) continue
    const d = new Date(ts * 1000)
    const key = format(d, "yyyy-MM-dd")
    byDay.set(key, Number(v) || 0)
  }

  const out: Array<{ date: string; points: number }> = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = format(d, "yyyy-MM-dd")
    out.push({ date: key, points: byDay.get(key) || 0 })
  }
  return out
}

function HeatmapGrid(props: { series: Array<{ date: string; points: number }> }) {
  // GitHub-style calendar grid: weeks x days
  const weeks: Array<Array<{ date: string; points: number }>> = []
  let current: Array<{ date: string; points: number }> = []

  // Align first day to Monday-ish grid by inserting blanks (Sun=0)
  const first = props.series[0]
  const firstDow = new Date(first.date).getDay()
  const pad = (firstDow + 6) % 7 // convert so Monday=0
  for (let i = 0; i < pad; i++) current.push({ date: "", points: 0 })

  for (const day of props.series) {
    current.push(day)
    if (current.length === 7) {
      weeks.push(current)
      current = []
    }
  }
  if (current.length) {
    while (current.length < 7) current.push({ date: "", points: 0 })
    weeks.push(current)
  }

  const max = Math.max(1, ...props.series.map((d) => d.points || 0))
  const colorFor = (p: number) => {
    if (p <= 0) return "bg-muted/30"
    const t = Math.min(1, p / max)
    if (t < 0.25) return "bg-emerald-200/70 dark:bg-emerald-900/50"
    if (t < 0.5) return "bg-emerald-300/80 dark:bg-emerald-800/60"
    if (t < 0.75) return "bg-emerald-400/90 dark:bg-emerald-700/70"
    return "bg-emerald-500 dark:bg-emerald-600"
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((d, di) => (
              <div
                key={`${wi}-${di}`}
                className={[
                  "h-3 w-3 rounded-sm border border-border/40",
                  d.date ? colorFor(d.points) : "bg-transparent border-transparent",
                ].join(" ")}
                title={d.date ? `${d.date}: ${d.points}` : ""}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function OverviewHeatmapCard(props: { user: string; boot?: any }) {
  const nowYear = new Date().getFullYear()
  const creation = props.boot?.user?.creation
  const creationYear =
    typeof creation === "string" && creation.length >= 4 ? Number(creation.slice(0, 4)) : nowYear
  const startYear = Number.isFinite(creationYear) ? creationYear : nowYear

  const years = React.useMemo(() => {
    const list: number[] = []
    for (let y = nowYear; y >= startYear; y--) list.push(y)
    return list
  }, [nowYear, startYear])

  const [year, setYear] = React.useState(String(nowYear))

  const date = React.useMemo(() => `${year}-01-01`, [year])
  const heatmapQuery = useQuery({
    queryKey: ["user-profile", "heatmap", props.user, date],
    queryFn: () => getEnergyPointsHeatmapData({ user: props.user, date }),
    enabled: !!props.user,
    staleTime: 60 * 1000,
    retry: 1,
  })

  const dataPoints = (heatmapQuery.data || {}) as Record<string, number>
  const series = React.useMemo(() => buildDailySeries(dataPoints, Number(year)), [dataPoints, year])
  const hasData = React.useMemo(() => series.some((d) => (d.points || 0) !== 0), [series])

  return (
    <UserProfileCard
      title="Overview"
      options={
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="h-8 w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      className="hidden lg:block"
    >
      <div className="relative">
        {hasData ? <HeatmapGrid series={series} /> : <div className={styles.nullState}>No Data to Show</div>}
      </div>
    </UserProfileCard>
  )
}

export function TypeDistributionCard(props: { user: string }) {
  const [field, setField] = React.useState<"type" | "reference_doctype" | "rule">("type")

  const chartQuery = useQuery({
    queryKey: ["user-profile", "percentage", props.user, field],
    queryFn: () => getEnergyPointsPercentageChartData({ user: props.user, field }),
    enabled: !!props.user,
    staleTime: 60 * 1000,
    retry: 1,
  })

  const labels: string[] = chartQuery.data?.labels || []
  const datasets = chartQuery.data?.datasets || []
  const values: number[] = datasets?.[0]?.values || []
  const data = labels.map((l, idx) => ({ name: l, value: Number(values[idx] || 0) })).filter((d) => d.value > 0)

  const COLORS = ["#7c3aed", "#2563eb", "#06b6d4", "#14b8a6", "#ec4899", "#ef4444", "#f97316", "#eab308"]

  return (
    <UserProfileCard
      title={`${field === "type" ? "Type" : field === "reference_doctype" ? "Reference Doctype" : "Rule"} Distribution`}
      options={
        <Select value={field} onValueChange={(v: any) => setField(v)}>
          <SelectTrigger className="h-8 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="type">Type</SelectItem>
            <SelectItem value="reference_doctype">Reference Doctype</SelectItem>
            <SelectItem value="rule">Rule</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <div className="relative">
        {chartQuery.isLoading ? (
          <div className={styles.nullState}>Loading…</div>
        ) : data.length === 0 ? (
          <div className={styles.nullState}>No Data to Show</div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} paddingAngle={2}>
                  {data.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="middle" align="right" layout="vertical" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </UserProfileCard>
  )
}

export function EnergyPointsLineCard(props: { user: string }) {
  const [type, setType] = React.useState<"All" | "Auto" | "Criticism" | "Appreciation" | "Revert">(
    "All"
  )
  const [timespan, setTimespan] = React.useState<"Last Week" | "Last Month" | "Last Quarter" | "Last Year">(
    "Last Month"
  )
  const [interval, setInterval] = React.useState<"Daily" | "Weekly" | "Monthly">("Daily")

  const filters = React.useMemo(() => {
    const base: any[] = [
      ["Energy Point Log", "user", "=", props.user, false],
      ["Energy Point Log", "type", "!=", "Review", false],
    ]
    if (type !== "All") {
      base[1] = ["Energy Point Log", "type", "=", type, false]
    }
    return base
  }, [props.user, type])

  const chartConfig = React.useMemo(() => {
    return {
      timespan: timespan,
      time_interval: interval,
      type: "Line",
      value_based_on: "points",
      chart_type: "Sum",
      document_type: "Energy Point Log",
      name: "Energy Points",
      width: "half",
      based_on: "creation",
      filters_json: JSON.stringify(filters),
    }
  }, [timespan, interval, filters])

  const chartQuery = useQuery({
    queryKey: ["user-profile", "line-chart", props.user, type, timespan, interval],
    queryFn: () => getDashboardChart({ chart: chartConfig, no_cache: 1 }),
    enabled: !!props.user,
    staleTime: 30 * 1000,
    retry: 1,
  })

  const lineData = React.useMemo(() => {
    const r: any = chartQuery.data
    const labels: string[] = r?.data?.labels || r?.labels || []
    const values: number[] = r?.data?.datasets?.[0]?.values || r?.datasets?.[0]?.values || []
    return labels.map((label, i) => ({ label, value: Number(values[i] || 0) }))
  }, [chartQuery.data])

  return (
    <UserProfileCard
      title="Energy Points"
      options={
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger className="h-8 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Auto">Auto</SelectItem>
              <SelectItem value="Criticism">Criticism</SelectItem>
              <SelectItem value="Appreciation">Appreciation</SelectItem>
              <SelectItem value="Revert">Revert</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timespan} onValueChange={(v: any) => setTimespan(v)}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Last Week">Last Week</SelectItem>
              <SelectItem value="Last Month">Last Month</SelectItem>
              <SelectItem value="Last Quarter">Last Quarter</SelectItem>
              <SelectItem value="Last Year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={interval} onValueChange={(v: any) => setInterval(v)}>
            <SelectTrigger className="h-8 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Daily">Daily</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="relative">
        {chartQuery.isLoading ? (
          <div className={styles.nullState}>Loading…</div>
        ) : lineData.length === 0 ? (
          <div className={styles.nullState}>No Data to Show</div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </UserProfileCard>
  )
}


