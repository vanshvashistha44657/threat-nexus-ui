import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, KeyValue } from "@/components/soc/panels";
import { Chip } from "@/components/soc/badges";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { IS_LIVE_BACKEND } from "@/services";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Platform Settings — SentinelOps" },
      { name: "description", content: "Configure SentinelOps console preferences, notification routing, data retention and backend connectivity." },
      { property: "og:title", content: "Platform Settings — SentinelOps" },
      { property: "og:description", content: "Console, notification and integration settings for the SOC platform." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const density = useUiStore((s) => s.density);
  const setDensity = useUiStore((s) => s.setDensity);
  const role = useAuthStore((s) => s.user?.role);
  const [prefs, setPrefs] = useState({ criticalEmail: true, incidentEmail: true, caseDigest: false, iocMatch: true });

  return (
    <>
      <PageHeader eyebrow="Configuration" title="Settings" description="Console preferences, notification routing and platform integration status." />
      <div className="grid gap-3 xl:grid-cols-2">
        <Panel className="space-y-4 p-4">
          <h3 className="text-sm font-semibold">Console preferences</h3>
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Table density</Label>
            <Select value={density} onValueChange={(v) => setDensity(v as "comfortable" | "compact")}>
              <SelectTrigger className="h-8 w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-x-4 rounded-md border border-border p-3">
            <KeyValue label="Theme" value="Dark SOC command center" />
            <KeyValue label="Timezone" value={Intl.DateTimeFormat().resolvedOptions().timeZone} mono />
            <KeyValue label="Effective role" value={role ?? "—"} />
            <KeyValue label="Session policy" value="30 min idle timeout" />
          </div>
        </Panel>

        <Panel className="space-y-4 p-4">
          <h3 className="text-sm font-semibold">Notification routing</h3>
          {([
            ["criticalEmail", "Critical alert e-mail"],
            ["incidentEmail", "Incident assignment e-mail"],
            ["caseDigest", "Daily case digest"],
            ["iocMatch", "IOC match notification"],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">{label}</Label>
              <Switch
                checked={prefs[key]}
                onCheckedChange={(v) => {
                  setPrefs((p) => ({ ...p, [key]: v }));
                  toast.success("Notification preference saved");
                }}
              />
            </div>
          ))}
        </Panel>

        <Panel className="space-y-3 p-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Backend integration</h3>
            <Chip tone={IS_LIVE_BACKEND ? "success" : "info"}>{IS_LIVE_BACKEND ? "Live FastAPI backend" : "Demo dataset"}</Chip>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The console talks to a single service abstraction. Set <span className="mono text-foreground">VITE_API_BASE_URL</span> to your
            FastAPI deployment and every module — alerts, incidents, cases, hunting, IOC, intel, assets, rules, reports and admin —
            switches to live endpoints, including the WebSocket event stream at <span className="mono text-foreground">/ws</span>.
            Without it the platform runs on a deterministic seeded dataset so the workflow stays fully demonstrable.
          </p>
        </Panel>
      </div>
    </>
  );
}
