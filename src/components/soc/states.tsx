import { AlertTriangle, Inbox, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingSkeleton({ rows = 6, className }: { rows?: number | undefined; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-md bg-muted/50" />
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number | undefined }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-lg bg-muted/50" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description: string;
  action?: React.ReactNode | undefined;
  icon?: React.ComponentType<{ className?: string }> | undefined;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-14 text-center">
      <div className="rounded-full border border-border bg-muted/40 p-3">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = "Unable to load data",
}: {
  error?: unknown;
  onRetry?: (() => void) | undefined;
  title?: string | undefined;
}) {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred while contacting the SentinelOps API.";
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <AlertTriangle className="size-6 text-destructive" />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}

export function ForbiddenState({ description }: { description?: string | undefined }) {
  return (
    <EmptyState
      icon={ShieldAlert}
      title="Insufficient privileges"
      description={
        description ??
        "Your role does not grant access to this area. Backend authorization remains the enforcing boundary."
      }
    />
  );
}
