import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/soc/panels";
import { DataTable, type Column } from "@/components/soc/data-table";
import { SeverityBadge, Chip } from "@/components/soc/badges";
import { relativeTime } from "@/components/soc/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounced, useIocActions, useIocs } from "@/hooks/use-soc-data";
import { useAuthStore } from "@/stores/auth-store";
import type { Ioc } from "@/services";

export const Route = createFileRoute("/_authenticated/ioc")({
  head: () => ({
    meta: [
      { title: "IOC Management — SentinelOps" },
      { name: "description", content: "Manage indicators of compromise: IPs, domains, URLs, hashes and registry keys with risk scoring and match counts." },
      { property: "og:title", content: "IOC Management — SentinelOps" },
      { property: "og:description", content: "Curate and track indicators of compromise across the estate." },
    ],
  }),
  component: IocPage,
});

function IocPage() {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 250);
  const { data, isLoading, error, refetch } = useIocs(debounced);
  const { remove } = useIocActions();
  const canWrite = useAuthStore((s) => s.has("iocs:write"));

  const columns: Column<Ioc>[] = [
    { key: "type", header: "Type", render: (r) => <Chip tone="neutral">{r.type}</Chip> },
    { key: "value", header: "Indicator", className: "min-w-[280px]", render: (r) => (
      <div className="min-w-0"><p className="mono truncate text-xs text-foreground">{r.value}</p><p className="truncate text-[11px] text-muted-foreground">{r.description}</p></div>
    ) },
    { key: "sev", header: "Severity", render: (r) => <SeverityBadge severity={r.severity} /> },
    { key: "risk", header: "Risk", render: (r) => <span className="mono text-xs">{r.riskScore}</span>, sortable: true, sortValue: (r) => r.riskScore },
    { key: "matches", header: "Matches", render: (r) => <span className="mono text-xs">{r.matches}</span>, sortable: true, sortValue: (r) => r.matches },
    { key: "source", header: "Source", render: (r) => <span className="text-xs text-muted-foreground">{r.source}</span> },
    { key: "last", header: "Last seen", render: (r) => <span className="mono text-[11px] text-muted-foreground">{relativeTime(r.lastSeen)}</span>, sortable: true, sortValue: (r) => r.lastSeen },
    { key: "act", header: "", render: (r) => canWrite ? (
      <span onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => remove.mutate(r.id)} aria-label="Delete indicator">
          <Trash2 className="size-3.5" />
        </Button>
      </span>
    ) : null },
  ];

  return (
    <>
      <PageHeader eyebrow="Intelligence" title="IOC Management" description="Curated indicators of compromise enriched with risk scoring and estate match counts." />
      <Panel className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search indicators by value, type, tag or source…" className="h-9 pl-8" />
        </div>
      </Panel>
      <DataTable columns={columns} rows={data} rowKey={(r) => r.id} isLoading={isLoading} error={error} onRetry={() => void refetch()} emptyTitle="No indicators found" emptyDescription="Adjust the search or ingest a threat feed to populate indicators." />
    </>
  );
}
