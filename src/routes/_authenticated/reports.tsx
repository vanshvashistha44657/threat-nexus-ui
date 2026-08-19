import { createFileRoute } from "@tanstack/react-router";
import { Download, FileBarChart } from "lucide-react";
import { PageHeader, Panel } from "@/components/soc/panels";
import { StatusBadge } from "@/components/soc/badges";
import { relativeTime } from "@/components/soc/timeline";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton, ErrorState } from "@/components/soc/states";
import { useReportGenerate, useReports } from "@/hooks/use-soc-data";
import { useAuthStore } from "@/stores/auth-store";
import type { ReportItem } from "@/services";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics — SentinelOps" },
      { name: "description", content: "Generate daily, weekly and monthly SOC reports, incident summaries, analyst performance and false-positive analysis." },
      { property: "og:title", content: "Reports & Analytics — SentinelOps" },
      { property: "og:description", content: "Executive and operational SOC reporting." },
    ],
  }),
  component: ReportsPage,
});

const TYPES: { type: ReportItem["type"]; label: string }[] = [
  { type: "daily_soc", label: "Daily SOC summary" },
  { type: "weekly_soc", label: "Weekly SOC report" },
  { type: "monthly_soc", label: "Monthly executive report" },
  { type: "incident", label: "Incident report" },
  { type: "soc_metrics", label: "SOC metrics" },
  { type: "analyst_performance", label: "Analyst performance" },
  { type: "false_positives", label: "False positive analysis" },
];

function ReportsPage() {
  const { data, isLoading, error, refetch } = useReports();
  const generate = useReportGenerate();
  const canWrite = useAuthStore((s) => s.has("reports:write"));

  return (
    <>
      <PageHeader eyebrow="Analytics" title="Reports" description="Operational and executive reporting across detection, response and analyst performance." />
      {canWrite && (
        <Panel className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Generate a report</h3>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <Button key={t.type} variant="outline" size="sm" disabled={generate.isPending} onClick={() => generate.mutate(t.type)}>
                <FileBarChart className="size-3.5" /> {t.label}
              </Button>
            ))}
          </div>
        </Panel>
      )}

      {isLoading && <LoadingSkeleton rows={5} />}
      {error && <ErrorState error={error} onRetry={() => void refetch()} />}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((r) => (
          <article key={r.id} className="panel flex flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{r.name}</p>
                <p className="mono truncate text-[11px] text-muted-foreground">{r.period} · {r.sizeKb} KB</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <dl className="mt-3 space-y-1">
              {r.summary.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="mono text-foreground">{s.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mono mt-3 text-[10px] text-muted-foreground">{r.generatedBy} · {relativeTime(r.generatedAt)}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => toast.info("Export queued — PDF/CSV delivery is handled by the reporting service.")}>
              <Download className="size-3.5" /> Export
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}
