import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationActions, useNotifications } from "@/hooks/use-soc-data";
import { SeverityBadge } from "./badges";
import { LoadingSkeleton, EmptyState, ErrorState } from "./states";
import { relativeTime } from "./timeline";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const { data, isLoading, error, refetch } = useNotifications();
  const { markRead, markAllRead } = useNotificationActions();
  const unread = data?.filter((n) => !n.read).length ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="mono absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-critical text-[9px] font-bold text-critical-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            disabled={!unread || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="size-3.5" /> Mark all read
          </Button>
        </div>
        <ScrollArea className="h-[380px]">
          <div className="p-2">
            {isLoading && <LoadingSkeleton rows={5} />}
            {error && <ErrorState error={error} onRetry={() => void refetch()} />}
            {data && data.length === 0 && (
              <EmptyState title="Nothing to review" description="You are all caught up." />
            )}
            {data?.slice(0, 20).map((n) => (
              <Link
                key={n.id}
                to={n.link ?? "/notifications"}
                onClick={() => !n.read && markRead.mutate(n.id)}
                className={cn(
                  "block rounded-md border border-transparent px-2.5 py-2 transition-colors hover:border-border hover:bg-accent/40",
                  !n.read && "bg-primary/5",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight text-foreground">{n.title}</p>
                  <SeverityBadge severity={n.severity} />
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                <p className="mono mt-1 text-[10px] text-muted-foreground">{relativeTime(n.createdAt)}</p>
              </Link>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t border-border p-2">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/notifications">Open notification center</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
