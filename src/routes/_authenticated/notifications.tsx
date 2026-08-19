import { createFileRoute } from "@tanstack/react-router";
import { CheckCheck } from "lucide-react";
import { PageHeader, Panel } from "@/components/soc/panels";
import { SeverityBadge, Chip } from "@/components/soc/badges";
import { relativeTime } from "@/components/soc/timeline";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/soc/states";
import { useNotificationActions, useNotifications } from "@/hooks/use-soc-data";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notification Center — SentinelOps" },
      { name: "description", content: "All SOC notifications: critical alerts, incident assignments, case updates, IOC matches and administrative actions." },
      { property: "og:title", content: "Notification Center — SentinelOps" },
      { property: "og:description", content: "Every SOC notification in one prioritised feed." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data, isLoading, error, refetch } = useNotifications();
  const { markRead, markAllRead } = useNotificationActions();
  const unread = data?.filter((n) => !n.read).length ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Awareness"
        title="Notification Center"
        description="Prioritised operational notifications delivered in real time from the event stream."
        actions={
          <>
            <Chip tone={unread ? "critical" : "success"}>{unread} unread</Chip>
            <Button variant="outline" size="sm" disabled={!unread} onClick={() => markAllRead.mutate()}>
              <CheckCheck className="size-3.5" /> Mark all read
            </Button>
          </>
        }
      />
      <Panel className="p-3">
        {isLoading && <LoadingSkeleton rows={8} />}
        {error && <ErrorState error={error} onRetry={() => void refetch()} />}
        {data && data.length === 0 && <EmptyState title="No notifications" description="Operational notifications will appear here as events occur." />}
        <ul className="divide-y divide-border">
          {data?.map((n) => (
            <li key={n.id} className={n.read ? "flex items-start gap-3 p-3" : "flex items-start gap-3 rounded-md bg-primary/5 p-3"}>
              <SeverityBadge severity={n.severity} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
                <p className="mono mt-1 text-[10px] text-muted-foreground">{n.category.replace(/_/g, " ")} · {relativeTime(n.createdAt)}</p>
              </div>
              {!n.read && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markRead.mutate(n.id)}>Mark read</Button>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
