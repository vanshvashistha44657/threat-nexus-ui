import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader, Panel, KeyValue } from "@/components/soc/panels";
import { DataTable, type Column } from "@/components/soc/data-table";
import { SeverityBadge, StatusBadge, Chip } from "@/components/soc/badges";
import { Timeline, relativeTime } from "@/components/soc/timeline";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCase, useCaseActions, useCases, useDebounced } from "@/hooks/use-soc-data";
import { useAuthStore } from "@/stores/auth-store";
import { LoadingSkeleton } from "@/components/soc/states";
import type { InvestigationCase } from "@/services";

export const Route = createFileRoute("/_authenticated/cases")({
  head: () => ({
    meta: [
      { title: "Case Management — SentinelOps" },
      { name: "description", content: "Manage SOC investigation cases with tasks, evidence chain-of-custody, notes and audit timelines." },
      { property: "og:title", content: "Case Management — SentinelOps" },
      { property: "og:description", content: "Structured investigation cases with tasks and evidence tracking." },
    ],
  }),
  component: CasesPage,
});

function CasesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const debounced = useDebounced(search, 250);
  const { data, isLoading, error, refetch } = useCases(debounced);
  const canWrite = useAuthStore((s) => s.has("cases:write"));

  const columns: Column<InvestigationCase>[] = [
    { key: "id", header: "Case", render: (r) => <span className="mono text-xs text-primary">{r.id}</span> },
    { key: "title", header: "Title", className: "min-w-[280px]", render: (r) => (
      <div className="min-w-0"><p className="truncate font-medium text-foreground">{r.title}</p><p className="truncate text-[11px] text-muted-foreground">{r.summary}</p></div>
    ) },
    { key: "severity", header: "Severity", render: (r) => <SeverityBadge severity={r.severity} /> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} />, sortable: true, sortValue: (r) => r.status },
    { key: "owner", header: "Owner", render: (r) => <span className="text-xs text-muted-foreground">{r.owner}</span> },
    { key: "tasks", header: "Tasks", render: (r) => <span className="mono text-xs">{r.tasks.filter((t) => t.done).length}/{r.tasks.length}</span> },
    { key: "updated", header: "Updated", render: (r) => <span className="mono text-[11px] text-muted-foreground">{relativeTime(r.updatedAt)}</span>, sortable: true, sortValue: (r) => r.updatedAt },
  ];

  return (
    <>
      <PageHeader eyebrow="Investigation" title="Case Management" description="Structured investigations linking alerts, incidents, tasks and evidence." />
      <Panel className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cases by ID, title or owner…" className="h-9 pl-8" />
        </div>
      </Panel>
      <DataTable columns={columns} rows={data} rowKey={(r) => r.id} isLoading={isLoading} error={error} onRetry={() => void refetch()} onRowClick={(r) => setSelected(r.id)} emptyTitle="No cases found" emptyDescription="Create a case from an incident to begin a formal investigation." />
      <CaseDetail id={selected} onClose={() => setSelected(null)} canWrite={canWrite} />
    </>
  );
}

function CaseDetail({ id, onClose, canWrite }: { id: string | null; onClose: () => void; canWrite: boolean }) {
  const { data: c, isLoading } = useCase(id);
  const { toggleTask } = useCaseActions();
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="text-base">{c?.title ?? "Case"}</SheetTitle>
          {c && (
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={c.severity} /><StatusBadge status={c.status} />
              <span className="mono text-[11px] text-muted-foreground">{c.id}</span>
            </div>
          )}
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="space-y-4 p-4">
            {isLoading && <LoadingSkeleton rows={8} />}
            {c && (
              <Tabs defaultValue="overview">
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                  <TabsTrigger value="tasks" className="flex-1">Tasks</TabsTrigger>
                  <TabsTrigger value="evidence" className="flex-1">Evidence</TabsTrigger>
                  <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">{c.summary}</p>
                  <div className="grid grid-cols-2 gap-x-4 rounded-md border border-border p-3">
                    <KeyValue label="Owner" value={c.owner} />
                    <KeyValue label="Linked incidents" value={c.incidentIds.join(", ") || "None"} mono />
                    <KeyValue label="Linked alerts" value={c.alertIds.length} mono />
                    <KeyValue label="Attachments" value={c.attachments.length} mono />
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Attachments</p>
                    <div className="space-y-1.5">
                      {c.attachments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between text-xs">
                          <span className="truncate text-foreground">{a.name}</span>
                          <span className="mono text-muted-foreground">{a.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="tasks" className="space-y-2">
                  {c.tasks.map((t) => (
                    <label key={t.id} className="flex items-start gap-2.5 rounded-md border border-border p-3">
                      <Checkbox checked={t.done} disabled={!canWrite} onCheckedChange={() => toggleTask.mutate({ caseId: c.id, taskId: t.id })} />
                      <span className="min-w-0">
                        <span className={t.done ? "block text-sm text-muted-foreground line-through" : "block text-sm text-foreground"}>{t.title}</span>
                        <span className="mono block text-[11px] text-muted-foreground">{t.owner}</span>
                      </span>
                    </label>
                  ))}
                </TabsContent>
                <TabsContent value="evidence" className="space-y-2">
                  {c.evidence.map((e) => (
                    <div key={e.id} className="rounded-md border border-border p-3">
                      <p className="text-sm font-medium text-foreground">{e.name}</p>
                      <p className="mono break-all text-[11px] text-muted-foreground">{e.type} · {e.hash}</p>
                      <p className="mono text-[11px] text-muted-foreground">{e.collectedBy} · {relativeTime(e.collectedAt)}</p>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="timeline"><Timeline entries={c.timeline} /></TabsContent>
              </Tabs>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
