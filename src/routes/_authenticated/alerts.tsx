import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Filter, RotateCcw, Search, Siren, UserCheck } from "lucide-react";
import { PageHeader, KeyValue, Panel } from "@/components/soc/panels";
import { DataTable, type Column } from "@/components/soc/data-table";
import { SeverityBadge, StatusBadge, Chip } from "@/components/soc/badges";
import { Timeline, absoluteTime, relativeTime } from "@/components/soc/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAlert, useAlertActions, useAlerts, useDebounced } from "@/hooks/use-soc-data";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import type { AlertEvent, AlertStatus, Severity } from "@/services";
import { LoadingSkeleton } from "@/components/soc/states";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: "Alert Queue — SentinelOps" },
      {
        name: "description",
        content:
          "Triage the SOC alert queue: filter by severity, status, MITRE technique and host, then investigate, assign or escalate alerts to incidents.",
      },
      { property: "og:title", content: "Alert Queue — SentinelOps" },
      { property: "og:description", content: "Severity-driven alert triage with full investigation context." },
    ],
  }),
  component: AlertsPage,
});

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];
const STATUSES: AlertStatus[] = ["new", "investigating", "escalated", "false_positive", "closed"];

function AlertsPage() {
  const globalSearch = useUiStore((s) => s.globalSearch);
  const [search, setSearch] = useState(globalSearch);
  const [severity, setSeverity] = useState<Severity[]>([]);
  const [status, setStatus] = useState<AlertStatus[]>([]);
  const [hours, setHours] = useState("168");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const debounced = useDebounced(search, 250);
  const canWrite = useAuthStore((s) => s.has("alerts:write"));

  useEffect(() => {
    if (globalSearch) setSearch(globalSearch);
  }, [globalSearch]);
  useEffect(() => setPage(1), [debounced, severity, status, hours]);

  const filters = useMemo(
    () => ({ search: debounced, severity, status, hours: Number(hours), page, pageSize: 12 }),
    [debounced, severity, status, hours, page],
  );
  const { data, isLoading, error, refetch, isFetching } = useAlerts(filters);

  const toggle = <T,>(list: T[], value: T, set: (v: T[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const columns: Column<AlertEvent>[] = [
    {
      key: "severity",
      header: "Severity",
      render: (r) => <SeverityBadge severity={r.severity} />,
      sortable: true,
      sortValue: (r) => SEVERITIES.indexOf(r.severity),
    },
    {
      key: "id",
      header: "Alert",
      className: "min-w-[260px]",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{r.title}</p>
          <p className="mono truncate text-[11px] text-muted-foreground">
            {r.id} · {r.ruleId}
          </p>
        </div>
      ),
    },
    { key: "host", header: "Host", render: (r) => <span className="mono text-xs">{r.host}</span>, sortable: true, sortValue: (r) => r.host },
    {
      key: "src",
      header: "Source → Destination",
      render: (r) => (
        <span className="mono text-xs text-muted-foreground">
          {r.sourceIp} → {r.destinationIp}
        </span>
      ),
    },
    { key: "mitre", header: "MITRE", render: (r) => <Chip tone="info">{r.mitreTechnique}</Chip> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} />, sortable: true, sortValue: (r) => r.status },
    {
      key: "assignee",
      header: "Assignee",
      render: (r) => <span className="text-xs text-muted-foreground">{r.assignee ?? "Unassigned"}</span>,
    },
    {
      key: "ts",
      header: "Detected",
      render: (r) => (
        <span className="mono whitespace-nowrap text-[11px] text-muted-foreground" title={absoluteTime(r.timestamp)}>
          {relativeTime(r.timestamp)}
        </span>
      ),
      sortable: true,
      sortValue: (r) => r.timestamp,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Detection"
        title="Alert Queue"
        description="Prioritised detections from endpoint, identity, network and cloud sensors."
        actions={
          <>
            <Chip tone="critical">{data?.total ?? 0} matching alerts</Chip>
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              <RotateCcw className={isFetching ? "size-3.5 animate-spin" : "size-3.5"} /> Refresh
            </Button>
          </>
        }
      />

      <Panel className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by alert ID, rule, host, user, IP or technique…"
              className="h-9 pl-8"
            />
          </div>
          <Select value={hours} onValueChange={setHours}>
            <SelectTrigger className="h-9 w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last hour</SelectItem>
              <SelectItem value="24">Last 24 hours</SelectItem>
              <SelectItem value="168">Last 7 days</SelectItem>
              <SelectItem value="720">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setSeverity([]);
              setStatus([]);
              setHours("168");
            }}
          >
            <Filter className="size-3.5" /> Clear
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mono mr-1 text-[10px] uppercase tracking-widest text-muted-foreground">Severity</span>
          {SEVERITIES.map((s) => (
            <button
              key={s}
              onClick={() => toggle(severity, s, setSeverity)}
              className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                severity.includes(s) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
          <span className="mono ml-3 mr-1 text-[10px] uppercase tracking-widest text-muted-foreground">Status</span>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => toggle(status, s, setStatus)}
              className={`rounded-md border px-2 py-0.5 text-[11px] transition-colors ${
                status.includes(s) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </Panel>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        onRowClick={(r) => setSelected(r.id)}
        total={data?.total}
        page={page}
        pageSize={12}
        onPageChange={setPage}
        emptyTitle="No alerts match the current filters"
        emptyDescription="Widen the time range or clear severity and status filters to see more detections."
      />

      <AlertDetail id={selected} onClose={() => setSelected(null)} canWrite={canWrite} />
    </>
  );
}

function AlertDetail({ id, onClose, canWrite }: { id: string | null; onClose: () => void; canWrite: boolean }) {
  const { data: alert, isLoading } = useAlert(id);
  const { update, addNote, escalate } = useAlertActions();
  const [note, setNote] = useState("");

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Siren className="size-4 text-primary" />
            {alert ? alert.title : "Alert investigation"}
          </SheetTitle>
          {alert && (
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={alert.severity} />
              <StatusBadge status={alert.status} />
              <Chip tone="info">{alert.mitreTechnique}</Chip>
              <span className="mono text-[11px] text-muted-foreground">{alert.id}</span>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="space-y-4 p-4">
            {isLoading && <LoadingSkeleton rows={8} />}
            {alert && (
              <Tabs defaultValue="overview">
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                  <TabsTrigger value="raw" className="flex-1">Raw event</TabsTrigger>
                  <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
                  <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{alert.description}</p>
                  <div className="grid grid-cols-2 gap-x-4 rounded-md border border-border p-3">
                    <KeyValue label="Detection rule" value={alert.rule} />
                    <KeyValue label="Rule ID" value={alert.ruleId} mono />
                    <KeyValue label="Host" value={alert.host} mono />
                    <KeyValue label="User" value={alert.user} mono />
                    <KeyValue label="Source IP" value={alert.sourceIp} mono />
                    <KeyValue label="Destination IP" value={alert.destinationIp} mono />
                    <KeyValue label="Tactic" value={alert.tactic} />
                    <KeyValue label="Technique" value={`${alert.mitreTechnique} · ${alert.mitreName}`} />
                    <KeyValue label="Risk score" value={`${alert.riskScore}/100`} mono />
                    <KeyValue label="Detected" value={absoluteTime(alert.timestamp)} mono />
                  </div>

                  {canWrite && (
                    <div className="space-y-2 rounded-md border border-border p-3">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Response actions</Label>
                      <div className="flex flex-wrap gap-2">
                        <Select
                          value={alert.status}
                          onValueChange={(v) => update.mutate({ id: alert.id, patch: { status: v as AlertStatus } })}
                        >
                          <SelectTrigger className="h-8 w-[180px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => update.mutate({ id: alert.id, patch: { assignee: "Current analyst" } })}
                        >
                          <UserCheck className="size-3.5" /> Assign to me
                        </Button>
                        <Button size="sm" onClick={() => escalate.mutate(alert.id)} disabled={escalate.isPending}>
                          <ArrowUpRight className="size-3.5" /> Escalate to incident
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="raw">
                  <pre className="mono max-h-[420px] overflow-auto rounded-md border border-border bg-surface-2/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
                    {JSON.stringify(alert.rawEvent, null, 2)}
                  </pre>
                </TabsContent>

                <TabsContent value="timeline">
                  <Timeline entries={alert.timeline} />
                </TabsContent>

                <TabsContent value="notes" className="space-y-3">
                  {alert.notes.length === 0 && (
                    <p className="text-sm text-muted-foreground">No analyst notes recorded on this alert.</p>
                  )}
                  {alert.notes.map((n) => (
                    <div key={n.id} className="rounded-md border border-border p-3">
                      <p className="text-sm text-foreground">{n.body}</p>
                      <p className="mono mt-1 text-[11px] text-muted-foreground">
                        {n.author} · {relativeTime(n.createdAt)}
                      </p>
                    </div>
                  ))}
                  {canWrite && (
                    <div className="space-y-2">
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Document triage findings, containment actions or hand-over context…"
                        rows={3}
                      />
                      <Button
                        size="sm"
                        disabled={!note.trim() || addNote.isPending}
                        onClick={() =>
                          addNote.mutate({ id: alert.id, body: note.trim() }, { onSuccess: () => setNote("") })
                        }
                      >
                        Add investigation note
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
