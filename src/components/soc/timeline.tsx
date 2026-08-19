import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import type { TimelineEntry } from "@/services";
import { EmptyState } from "./states";

export function relativeTime(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function absoluteTime(iso: string) {
  try {
    return format(new Date(iso), "dd MMM yyyy HH:mm:ss");
  } catch {
    return iso;
  }
}

export function Timeline({ entries, className }: { entries: TimelineEntry[]; className?: string }) {
  if (!entries.length)
    return <EmptyState title="No timeline activity" description="Actions taken on this record will appear here." />;

  return (
    <ol className={cn("relative space-y-4 border-l border-border pl-5", className)}>
      {entries.map((e) => (
        <li key={e.id} className="relative">
          <span
            className={cn(
              "absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-background",
              e.severity === "critical"
                ? "bg-critical"
                : e.severity === "high"
                  ? "bg-high"
                  : e.severity === "medium"
                    ? "bg-medium"
                    : "bg-primary",
            )}
          />
          <p className="text-sm font-medium text-foreground">{e.action}</p>
          {e.detail && <p className="text-xs text-muted-foreground">{e.detail}</p>}
          <p className="mono mt-0.5 text-[11px] text-muted-foreground">
            {e.actor} · {absoluteTime(e.at)} · {relativeTime(e.at)}
          </p>
        </li>
      ))}
    </ol>
  );
}
