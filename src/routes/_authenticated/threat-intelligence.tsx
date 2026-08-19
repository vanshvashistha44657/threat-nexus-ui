import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/soc/panels";
import { SeverityBadge, Chip } from "@/components/soc/badges";
import { relativeTime } from "@/components/soc/timeline";
import { Switch } from "@/components/ui/switch";
import { LoadingSkeleton } from "@/components/soc/states";
import { useActors, useFeedToggle, useFeeds, useIntelMatches } from "@/hooks/use-soc-data";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/_authenticated/threat-intelligence")({
  head: () => ({
    meta: [
      { title: "Threat Intelligence — SentinelOps" },
      { name: "description", content: "Threat feeds, tracked adversary groups and recent intelligence matches observed across the monitored estate." },
      { property: "og:title", content: "Threat Intelligence — SentinelOps" },
      { property: "og:description", content: "Adversary tracking and feed management for the SOC." },
    ],
  }),
  component: IntelPage,
});

function IntelPage() {
  const feeds = useFeeds();
  const actors = useActors();
  const matches = useIntelMatches();
  const toggle = useFeedToggle();
  const canWrite = useAuthStore((s) => s.has("iocs:write"));

  return (
    <>
      <PageHeader eyebrow="Intelligence" title="Threat Intelligence" description="Feed health, adversary tracking and observed intelligence matches." />
      <div className="grid gap-3 xl:grid-cols-2">
        <Panel className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Threat feeds</h3>
          {feeds.isLoading && <LoadingSkeleton rows={4} />}
          <div className="space-y-2">
            {feeds.data?.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{f.name}</p>
                  <p className="mono truncate text-[11px] text-muted-foreground">{f.provider} · {f.indicators.toLocaleString()} indicators · reliability {f.reliability} · synced {relativeTime(f.lastSync)}</p>
                </div>
                <Switch checked={f.enabled} disabled={!canWrite} onCheckedChange={(v) => toggle.mutate({ id: f.id, enabled: v })} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Recent intelligence matches</h3>
          {matches.isLoading && <LoadingSkeleton rows={4} />}
          <div className="space-y-2">
            {matches.data?.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
                <div className="min-w-0">
                  <p className="mono truncate text-xs text-foreground">{m.value}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{m.source} · {m.matches} matches · {relativeTime(m.lastSeen)}</p>
                </div>
                <SeverityBadge severity={m.severity} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Tracked threat actors</h3>
        {actors.isLoading && <LoadingSkeleton rows={4} />}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {actors.data?.map((a) => (
            <article key={a.id} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{a.name}</p>
                <Chip tone={a.activity > 70 ? "critical" : a.activity > 40 ? "high" : "neutral"}>activity {a.activity}</Chip>
              </div>
              <p className="mono mt-0.5 truncate text-[11px] text-muted-foreground">{a.aliases.join(", ")}</p>
              <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{a.summary}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {a.techniques.slice(0, 4).map((t) => <Chip key={t} tone="info">{t}</Chip>)}
              </div>
              <p className="mono mt-2 text-[10px] text-muted-foreground">{a.origin} · {a.motivation} · last seen {relativeTime(a.lastSeen)}</p>
            </article>
          ))}
        </div>
      </Panel>
    </>
  );
}
