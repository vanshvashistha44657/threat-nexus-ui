import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader, Panel } from "@/components/soc/panels";
import { DataTable, type Column } from "@/components/soc/data-table";
import { StatusBadge, Chip } from "@/components/soc/badges";
import { relativeTime } from "@/components/soc/timeline";
import { Input } from "@/components/ui/input";
import { useAssets, useDebounced } from "@/hooks/use-soc-data";
import type { Asset } from "@/services";

export const Route = createFileRoute("/_authenticated/assets")({
  head: () => ({
    meta: [
      { title: "Asset Management — SentinelOps" },
      { name: "description", content: "Inventory of servers, endpoints, cloud workloads and identities with criticality, risk score and patch status." },
      { property: "og:title", content: "Asset Management — SentinelOps" },
      { property: "og:description", content: "Risk-ranked asset inventory for the monitored estate." },
    ],
  }),
  component: AssetsPage,
});

function AssetsPage() {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 250);
  const { data, isLoading, error, refetch } = useAssets(debounced);

  const columns: Column<Asset>[] = [
    { key: "name", header: "Asset", className: "min-w-[240px]", render: (r) => (
      <div className="min-w-0"><p className="truncate font-medium text-foreground">{r.name}</p><p className="mono truncate text-[11px] text-muted-foreground">{r.id} · {r.ip} · {r.os}</p></div>
    ) },
    { key: "type", header: "Type", render: (r) => <Chip tone="neutral">{r.type}</Chip> },
    { key: "crit", header: "Criticality", render: (r) => <Chip tone={r.criticality === "critical" ? "critical" : r.criticality === "high" ? "high" : "neutral"}>{r.criticality}</Chip> },
    { key: "risk", header: "Risk", render: (r) => <span className="mono text-xs">{r.riskScore}</span>, sortable: true, sortValue: (r) => r.riskScore },
    { key: "patch", header: "Patch status", render: (r) => <StatusBadge status={r.patchStatus} /> },
    { key: "owner", header: "Owner", render: (r) => <span className="text-xs text-muted-foreground">{r.owner}</span> },
    { key: "alerts", header: "Alerts", render: (r) => <span className="mono text-xs">{r.alertIds.length}</span> },
    { key: "seen", header: "Last seen", render: (r) => <span className="mono text-[11px] text-muted-foreground">{relativeTime(r.lastSeen)}</span> },
  ];

  return (
    <>
      <PageHeader eyebrow="Attack surface" title="Asset Management" description="Risk-ranked inventory of monitored servers, endpoints, cloud workloads and identities." />
      <Panel className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets by name, IP, owner or OS…" className="h-9 pl-8" />
        </div>
      </Panel>
      <DataTable columns={columns} rows={data} rowKey={(r) => r.id} isLoading={isLoading} error={error} onRetry={() => void refetch()} emptyTitle="No assets found" emptyDescription="Adjust the search to locate assets in the inventory." />
    </>
  );
}
