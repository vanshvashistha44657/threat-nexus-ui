import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader, Panel } from "@/components/soc/panels";
import { DataTable, type Column } from "@/components/soc/data-table";
import { SeverityBadge, Chip } from "@/components/soc/badges";
import { relativeTime } from "@/components/soc/timeline";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounced, useRuleToggle, useRules } from "@/hooks/use-soc-data";
import { useAuthStore } from "@/stores/auth-store";
import type { DetectionRule } from "@/services";

export const Route = createFileRoute("/_authenticated/detection-rules")({
  head: () => ({
    meta: [
      { title: "Detection Rules — SentinelOps" },
      { name: "description", content: "Manage Sigma, vendor and custom detection rules with MITRE mapping, trigger volume and false-positive rates." },
      { property: "og:title", content: "Detection Rules — SentinelOps" },
      { property: "og:description", content: "Detection engineering with MITRE-mapped rule coverage and tuning metrics." },
    ],
  }),
  component: RulesPage,
});

function RulesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DetectionRule | null>(null);
  const debounced = useDebounced(search, 250);
  const { data, isLoading, error, refetch } = useRules(debounced);
  const toggle = useRuleToggle();
  const canWrite = useAuthStore((s) => s.has("rules:write"));

  const columns: Column<DetectionRule>[] = [
    { key: "enabled", header: "Enabled", render: (r) => (
      <span onClick={(e) => e.stopPropagation()}>
        <Switch checked={r.enabled} disabled={!canWrite} onCheckedChange={(v) => toggle.mutate({ id: r.id, enabled: v })} />
      </span>
    ) },
    { key: "name", header: "Rule", className: "min-w-[300px]", render: (r) => (
      <div className="min-w-0"><p className="truncate font-medium text-foreground">{r.name}</p><p className="mono truncate text-[11px] text-muted-foreground">{r.id} · {r.source}</p></div>
    ) },
    { key: "sev", header: "Severity", render: (r) => <SeverityBadge severity={r.severity} /> },
    { key: "mitre", header: "MITRE", render: (r) => <Chip tone="info">{r.mitre}</Chip> },
    { key: "triggers", header: "Triggers 30d", render: (r) => <span className="mono text-xs">{r.triggers30d}</span>, sortable: true, sortValue: (r) => r.triggers30d },
    { key: "fp", header: "FP rate", render: (r) => <span className="mono text-xs">{r.falsePositiveRate}%</span>, sortable: true, sortValue: (r) => r.falsePositiveRate },
    { key: "last", header: "Last triggered", render: (r) => <span className="mono text-[11px] text-muted-foreground">{r.lastTriggered ? relativeTime(r.lastTriggered) : "never"}</span> },
  ];

  return (
    <>
      <PageHeader eyebrow="Detection engineering" title="Detection Rules" description="Rule coverage, tuning and MITRE ATT&CK alignment across all log sources." />
      <Panel className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rules by name, ID, source or technique…" className="h-9 pl-8" />
        </div>
      </Panel>
      <DataTable columns={columns} rows={data} rowKey={(r) => r.id} isLoading={isLoading} error={error} onRetry={() => void refetch()} onRowClick={setSelected} emptyTitle="No detection rules found" emptyDescription="Adjust the search to locate rules in the detection library." />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full gap-0 overflow-hidden p-0 sm:max-w-xl">
          <SheetHeader className="border-b border-border">
            <SheetTitle className="text-base">{selected?.name}</SheetTitle>
            {selected && (
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={selected.severity} />
                <Chip tone="info">{selected.mitre} · {selected.mitreName}</Chip>
                <span className="mono text-[11px] text-muted-foreground">{selected.id}</span>
              </div>
            )}
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-140px)]">
            {selected && (
              <div className="space-y-3 p-4">
                <p className="text-sm text-muted-foreground">{selected.description}</p>
                <pre className="mono overflow-auto rounded-md border border-border bg-surface-2/60 p-3 text-[11px] leading-relaxed text-muted-foreground">{selected.logic}</pre>
                <p className="mono text-[11px] text-muted-foreground">Author {selected.author} · updated {relativeTime(selected.updatedAt)}</p>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
