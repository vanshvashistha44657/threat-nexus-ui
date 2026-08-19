import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play, Save } from "lucide-react";
import { PageHeader, Panel } from "@/components/soc/panels";
import { DataTable, type Column } from "@/components/soc/data-table";
import { SeverityBadge, Chip } from "@/components/soc/badges";
import { relativeTime } from "@/components/soc/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHuntRun, useHuntSave, useSavedHunts } from "@/hooks/use-soc-data";
import type { HuntResult } from "@/services";

export const Route = createFileRoute("/_authenticated/threat-hunting")({
  head: () => ({
    meta: [
      { title: "Threat Hunting — SentinelOps" },
      { name: "description", content: "Proactively hunt across endpoint, process and network telemetry with a structured query builder and saved hunts." },
      { property: "og:title", content: "Threat Hunting — SentinelOps" },
      { property: "og:description", content: "Structured hypothesis-driven hunting across SOC telemetry." },
    ],
  }),
  component: HuntingPage,
});

const FIELDS = ["process", "commandLine", "host", "user", "sourceIp", "destinationIp", "mitre"];

function HuntingPage() {
  const [field, setField] = useState("commandLine");
  const [operator, setOperator] = useState("contains");
  const [value, setValue] = useState("");
  const [hours, setHours] = useState("168");
  const run = useHuntRun();
  const save = useHuntSave();
  const saved = useSavedHunts();

  const columns: Column<HuntResult>[] = [
    { key: "ts", header: "Time", render: (r) => <span className="mono text-[11px] text-muted-foreground">{relativeTime(r.timestamp)}</span> },
    { key: "sev", header: "Severity", render: (r) => <SeverityBadge severity={r.severity} /> },
    { key: "host", header: "Host", render: (r) => <span className="mono text-xs">{r.host}</span> },
    { key: "user", header: "User", render: (r) => <span className="mono text-xs">{r.user}</span> },
    { key: "proc", header: "Process", render: (r) => <span className="mono text-xs">{r.process}</span> },
    { key: "cmd", header: "Command line", className: "min-w-[320px]", render: (r) => <span className="mono block max-w-[420px] truncate text-[11px] text-muted-foreground">{r.commandLine}</span> },
    { key: "mitre", header: "MITRE", render: (r) => <Chip tone="info">{r.mitre}</Chip> },
  ];

  const query = `${field} ${operator} "${value}" | last ${hours}h`;

  return (
    <>
      <PageHeader eyebrow="Proactive defence" title="Threat Hunting" description="Hypothesis-driven search across process, identity and network telemetry." />
      <Panel className="space-y-3 p-4">
        <div className="grid gap-2 md:grid-cols-[180px_180px_1fr_150px_auto]">
          <Select value={field} onValueChange={setField}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{FIELDS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={operator} onValueChange={setOperator}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="contains">contains</SelectItem>
              <SelectItem value="not_contains">does not contain</SelectItem>
            </SelectContent>
          </Select>
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. powershell -enc" className="h-9" />
          <Select value={hours} onValueChange={setHours}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24">Last 24 hours</SelectItem>
              <SelectItem value="168">Last 7 days</SelectItem>
              <SelectItem value="720">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button className="h-9" onClick={() => run.mutate({ field, operator, value, hours: Number(hours) })} disabled={run.isPending}>
              <Play className="size-3.5" /> Run hunt
            </Button>
            <Button variant="outline" className="h-9" onClick={() => save.mutate({ name: `Hunt: ${value || field}`, query })}>
              <Save className="size-3.5" /> Save
            </Button>
          </div>
        </div>
        <p className="mono rounded-md border border-border bg-surface-2/50 px-3 py-2 text-[11px] text-muted-foreground">{query}</p>
      </Panel>

      <DataTable columns={columns} rows={run.data} rowKey={(r) => r.id} isLoading={run.isPending} error={run.error} emptyTitle="No hunt results yet" emptyDescription="Build a query above and run the hunt to search historical telemetry." />

      <Panel className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Saved hunts</h3>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {saved.data?.map((h) => (
            <button key={h.id} className="rounded-md border border-border p-3 text-left transition-colors hover:border-primary/40" onClick={() => setValue(h.query.split('"')[1] ?? "")}>
              <p className="truncate text-sm font-medium text-foreground">{h.name}</p>
              <p className="mono truncate text-[11px] text-muted-foreground">{h.query}</p>
              <p className="mono mt-1 text-[10px] text-muted-foreground">{h.createdBy} · {h.results} results · {relativeTime(h.lastRun)}</p>
            </button>
          ))}
        </div>
      </Panel>
    </>
  );
}
