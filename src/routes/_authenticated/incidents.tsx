import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ShieldAlert } from "lucide-react";
import { PageHeader, KeyValue, Panel, MetricCard } from "@/components/soc/panels";
import { DataTable, type Column } from "@/components/soc/data-table";
import { SeverityBadge, StatusBadge, Chip } from "@/components/soc/badges";
import { Timeline, absoluteTime, relativeTime } from "@/components/soc/timeline";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounced, useIncident, useIncidentUpdate, useIncidents } from "@/hooks/use-soc-data";
import { useAuthStore } from "@/stores/auth-store";
import { LoadingSkeleton } from "@/components/soc/states";
import type { Incident, IncidentStatus } from "@/services";

export const Route = createFileRoute("/_authenticated/incidents")({
  head: () => ({
    meta: [
      { title: "Incident Response — SentinelOps" },
      {
        name: "description",
        content:
          "Track security incidents through open, investigation, containment, eradication and resolution with full timelines and evidence.",
      },
      { property: "og:title", content: "Incident Response — SentinelOps" },
      { property: "og:description", content: "Coordinate SOC incident response with lifecycle tracking and evidence." },
    ],
  }),
  component: IncidentsPage,
});

const STATUSES: IncidentStatus[] = ["open", "investigating", "containment", "eradication", "resolved"];

function IncidentsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const debounced = useDebounced(search, 250);
  const { data, isLoading, error, refetch } = useIncidents(debounced);
  const canWrite = useAuthStore((s) => s.has("incidents:write"));

  const open = data?.filter((i) => i.status !== "resolved").length ?? 0;
  const p1 = data?.filter((i) => i.priority === "P1").length ?? 0;
  const resolved = data?.filter((i) => i.status === "resolved").length ?? 0;

  const columns: Column<Incident>[] = [
    { key: "id", header: "ID", render: (r) => <span className="mono text-xs text-primary">{r.id}</span> },
    {
      key: "title",
      header: "Incident",
      className: "min-w-[280px]",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{r.title}</p>
          <p className="truncate text-[11px] text-muted-foreground">{r.summary}</p>
        </div>
      ),
    },
    { key: "priority", header: "Priority", render: (r) => <Chip tone={r.priority === "P1" ? "critical" : r.priority === "P2" ? "high" : "neutral"}>{r.priority}</Chip>, sortable: true, sortValue: (r) => r.priority },
    { key: "severity", header: "Severity", render: (r) => <SeverityBadge severity={r.severity} /> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} />, sortable: true, sortValue: (r) => r.status },
    { key: "assets", header: "Assets", render: (r) => <span className="mono text-xs">{r.affectedAssets.length}</span> },
    { key: "assignee", header: "Owner", render: (r) => <span className="text-xs text-muted-foreground">{r.assignee ?? "Unassigned"}</span> },
    {
      key: "updated",
      header: "Updated",
      render: (r) => <span className="mono text-[11px] text-muted-foreground">{relativeTime(r.updatedAt)}</span>,
      sortable: true,
      sortValue: (r) => r.updatedAt,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Response"
        title="Incident Management"
        description="Coordinated response workflow from detection through containment to eradication."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active incidents" value={open} icon={ShieldAlert} tone="high" />
        <MetricCard label="P1 major incidents" value={p1} icon={ShieldAlert} tone="critical" />
        <MetricCard label="Resolved" value={resolved} icon={ShieldAlert} tone="success" />
        <MetricCard label="Total tracked" value={data?.length ?? 0} icon={ShieldAlert} />
      </div>

      <Panel className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incidents by ID, title, owner or affected asset…"
            className="h-9 pl-8"
          />
        </div>
      </Panel>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        onRowClick={(r) => setSelected(r.id)}
        emptyTitle="No incidents found"
        emptyDescription="Escalate an alert from the alert queue to open a new incident."
      />

      <IncidentDetail id={selected} onClose={() => setSelected(null)} canWrite={canWrite} />
    </>
  );
}

function IncidentDetail({ id, onClose, canWrite }: { id: string | null; onClose: () => void; canWrite: boolean }) {
  const { data: inc, isLoading } = useIncident(id);
  const update = useIncidentUpdate();

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="text-base">{inc?.title ?? "Incident"}</SheetTitle>
          {inc && (
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={inc.severity} />
              <StatusBadge status={inc.status} />
              <Chip tone={inc.priority === "P1" ? "critical" : "neutral"}>{inc.priority}</Chip>
              <span className="mono text-[11px] text-muted-foreground">{inc.id}</span>
            </div>
          )}
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="space-y-4 p-4">
            {isLoading && <LoadingSkeleton rows={8} />}
            {inc && (
              <Tabs defaultValue="overview">
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                  <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
                  <TabsTrigger value="evidence" className="flex-1">Evidence</TabsTrigger>
                  <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{inc.summary}</p>
                  <div className="grid grid-cols-2 gap-x-4 rounded-md border border-border p-3">
                    <KeyValue label="Owner" value={inc.assignee ?? "Unassigned"} />
                    <KeyValue label="Opened" value={absoluteTime(inc.createdAt)} mono />
                    <KeyValue label="Last update" value={relativeTime(inc.updatedAt)} mono />
                    <KeyValue label="Linked alerts" value={inc.alertIds.length} mono />
                    <KeyValue label="MITRE techniques" value={inc.mitre.join(", ")} mono />
                    <KeyValue label="Resolution" value={inc.resolution ?? "Pending"} />
                  </div>

                  <div className="rounded-md border border-border p-3">
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Affected assets</p>
                    <div className="flex flex-wrap gap-1.5">
                      {inc.affectedAssets.map((a) => (
                        <Chip key={a} tone="neutral">{a}</Chip>
                      ))}
                    </div>
                  </div>

                  {canWrite && (
                    <div className="rounded-md border border-border p-3">
                      <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Lifecycle</p>
                      <Select
                        value={inc.status}
                        onValueChange={(v) => update.mutate({ id: inc.id, patch: { status: v as IncidentStatus } })}
                      >
                        <SelectTrigger className="h-8 w-[220px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="timeline">
                  <Timeline entries={inc.timeline} />
                </TabsContent>

                <TabsContent value="evidence" className="space-y-2">
                  {inc.evidence.map((e) => (
                    <div key={e.id} className="rounded-md border border-border p-3">
                      <p className="text-sm font-medium text-foreground">{e.name}</p>
                      <p className="mono break-all text-[11px] text-muted-foreground">
                        {e.type} · {e.hash}
                      </p>
                      <p className="mono text-[11px] text-muted-foreground">
                        collected by {e.collectedBy} · {relativeTime(e.collectedAt)}
                      </p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="notes" className="space-y-2">
                  {inc.notes.map((n) => (
                    <div key={n.id} className="rounded-md border border-border p-3">
                      <p className="text-sm text-foreground">{n.body}</p>
                      <p className="mono mt-1 text-[11px] text-muted-foreground">
                        {n.author} · {relativeTime(n.createdAt)}
                      </p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
