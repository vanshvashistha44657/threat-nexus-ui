import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BriefcaseBusiness,
  Fingerprint,
  Gauge,
  Radio,
  ServerCrash,
  ShieldAlert,
  Siren,
} from "lucide-react";
import { PageHeader, MetricCard, ChartCard, Panel } from "@/components/soc/panels";
import { CardSkeleton, ErrorState, LoadingSkeleton } from "@/components/soc/states";
import { SeverityBadge, StatusBadge, Chip } from "@/components/soc/badges";
import { relativeTime } from "@/components/soc/timeline";
import { useLiveFeed, useMetrics, useSystemHealth } from "@/hooks/use-soc-data";
import { useRealtimeStore } from "@/stores/realtime-store";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "SOC Dashboard — SentinelOps" },
      {
        name: "description",
        content:
          "Real-time security operations dashboard: critical alerts, open incidents, MITRE ATT&CK coverage, analyst workload and threat activity.",
      },
      { property: "og:title", content: "SOC Dashboard — SentinelOps" },
      { property: "og:description", content: "Live security posture across alerts, incidents, cases and assets." },
    ],
  }),
  component: DashboardPage,
});

const SEV_COLORS: Record<string, string> = {
  critical: "var(--critical)",
  high: "var(--high)",
  medium: "var(--medium)",
  low: "var(--low)",
  info: "var(--primary)",
};

const chartTooltip = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "var(--popover-foreground)",
  },
} as const;

function DashboardPage() {
  const { data: m, isLoading, error, refetch } = useMetrics();
  const feed = useLiveFeed();
  const health = useSystemHealth();
  const events = useRealtimeStore((s) => s.events);
  const eventsSeen = useRealtimeStore((s) => s.eventsSeen);

  return (
    <>
      <PageHeader
        eyebrow="Security Operations Center"
        title="Operations Dashboard"
        description="Consolidated detection, response and risk posture across the monitored estate."
        actions={
          <>
            <Chip tone="info">
              <Radio className="size-3" /> {eventsSeen} live events this session
            </Chip>
            <Chip tone="success">Security score {m?.securityScore ?? "—"}/100</Chip>
          </>
        }
      />

      {isLoading && <CardSkeleton count={8} />}
      {error && <ErrorState error={error} onRetry={() => void refetch()} />}

      {m && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Critical alerts" value={m.criticalAlerts} icon={Siren} tone="critical" delta={12} hint="last 24h" />
            <MetricCard label="High alerts" value={m.highAlerts} icon={ShieldAlert} tone="high" delta={4} hint="last 24h" />
            <MetricCard label="Open incidents" value={m.openIncidents} icon={ServerCrash} tone="medium" delta={-8} hint="active response" />
            <MetricCard label="Active cases" value={m.activeCases} icon={BriefcaseBusiness} hint="under investigation" />
            <MetricCard label="IOC matches" value={m.iocMatches} icon={Fingerprint} tone="high" hint="observed on estate" />
            <MetricCard label="Assets at risk" value={m.assetsAtRisk} icon={Gauge} tone="medium" hint="risk score > 70" />
            <MetricCard label="MTTR" value={`${m.mttrMinutes}m`} icon={Activity} tone="success" delta={-15} hint="mean time to respond" />
            <MetricCard label="False positive rate" value={`${m.falsePositiveRate}%`} icon={Activity} tone="success" delta={-3} hint="30-day rolling" />
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            <ChartCard
              title="Alert volume by severity"
              subtitle="Rolling 24 hours, hourly buckets"
              className="xl:col-span-2"
            >
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={m.alertVolume}>
                    <defs>
                      {(["critical", "high", "medium", "low"] as const).map((s) => (
                        <linearGradient key={s} id={`g-${s}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SEV_COLORS[s]} stopOpacity={0.5} />
                          <stop offset="100%" stopColor={SEV_COLORS[s]} stopOpacity={0.02} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip {...chartTooltip} />
                    {(["critical", "high", "medium", "low"] as const).map((s) => (
                      <Area
                        key={s}
                        type="monotone"
                        dataKey={s}
                        stackId="1"
                        stroke={SEV_COLORS[s]}
                        fill={`url(#g-${s})`}
                        strokeWidth={1.5}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Severity distribution" subtitle="Open alerts by severity">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={m.severityDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={90}
                      paddingAngle={3}
                      stroke="var(--background)"
                    >
                      {m.severityDistribution.map((d) => (
                        <Cell key={d.name} fill={SEV_COLORS[d.severity]} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {m.severityDistribution.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="size-2 rounded-full" style={{ background: SEV_COLORS[d.severity] }} />
                      {d.name}
                    </span>
                    <span className="mono text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            <ChartCard title="MITRE ATT&CK coverage" subtitle="Detections by technique (30d)" className="xl:col-span-2">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={m.mitreDistribution} layout="vertical" margin={{ left: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="technique"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      width={78}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip {...chartTooltip} />
                    <Bar dataKey="count" fill="var(--primary)" radius={[0, 3, 3, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <Panel className="flex flex-col p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Live event stream</h3>
                <span className="mono flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-success">
                  <span className="live-dot size-1.5 rounded-full bg-success" /> streaming
                </span>
              </div>
              <ScrollArea className="h-[240px] pr-2">
                {events.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    Waiting for the next telemetry event…
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {events.map((e) => (
                      <li key={e.id} className="rounded-md border border-border bg-surface-2/40 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-medium text-foreground">{e.message}</p>
                          <SeverityBadge severity={e.severity} />
                        </div>
                        <p className="mono mt-0.5 truncate text-[10px] text-muted-foreground">
                          {e.kind} · {e.detail} · {relativeTime(e.at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </Panel>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            <ChartCard title="Incident throughput" subtitle="Opened vs resolved (14 days)">
              <div className="h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={m.incidentTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip {...chartTooltip} />
                    <Line type="monotone" dataKey="opened" stroke="var(--high)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="resolved" stroke="var(--success)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Threat activity index" subtitle="Composite risk vs blocked attempts">
              <div className="h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={m.threatActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip {...chartTooltip} />
                    <Area type="monotone" dataKey="score" stroke="var(--critical)" fill="var(--critical)" fillOpacity={0.12} strokeWidth={2} />
                    <Area type="monotone" dataKey="blocked" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <Panel className="p-4">
              <h3 className="mb-3 text-sm font-semibold">Analyst workload</h3>
              <div className="space-y-3">
                {m.analystWorkload.map((a) => (
                  <div key={a.analyst}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate text-foreground">{a.analyst}</span>
                      <span className="mono text-muted-foreground">
                        {a.open}/{a.capacity}
                      </span>
                    </div>
                    <Progress value={(a.open / a.capacity) * 100} className="mt-1 h-1.5" />
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            <Panel className="p-4 xl:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Latest alerts</h3>
                <Link to="/alerts" className="text-xs text-primary hover:underline">
                  Open alert queue →
                </Link>
              </div>
              {feed.isLoading && <LoadingSkeleton rows={5} />}
              {feed.error && <ErrorState error={feed.error} onRetry={() => void feed.refetch()} />}
              <ul className="divide-y divide-border">
                {feed.data?.slice(0, 8).map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2">
                    <SeverityBadge severity={a.severity} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{a.title}</p>
                      <p className="mono truncate text-[11px] text-muted-foreground">
                        {a.id} · {a.host} · {a.mitreTechnique} · {relativeTime(a.timestamp)}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel className="p-4">
              <h3 className="mb-3 text-sm font-semibold">Platform health</h3>
              {health.isLoading && <LoadingSkeleton rows={5} />}
              <ul className="space-y-2">
                {health.data?.map((s) => (
                  <li key={s.name} className="flex items-center justify-between rounded-md border border-border px-2.5 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{s.name}</p>
                      <p className="mono text-[10px] text-muted-foreground">
                        {s.latencyMs}ms · {s.uptime}% uptime
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
