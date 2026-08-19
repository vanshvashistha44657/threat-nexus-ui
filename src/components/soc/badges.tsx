import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { Severity } from "@/services";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap",
  {
    variants: {
      tone: {
        critical: "border-critical/40 bg-critical/15 text-critical",
        high: "border-high/40 bg-high/15 text-high",
        medium: "border-medium/40 bg-medium/15 text-medium",
        low: "border-low/40 bg-low/15 text-low",
        info: "border-primary/40 bg-primary/10 text-primary",
        success: "border-success/40 bg-success/15 text-success",
        muted: "border-border bg-muted/60 text-muted-foreground",
        neutral: "border-border bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: { tone: "muted" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badge>["tone"]>;

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const tone: BadgeTone =
    severity === "critical"
      ? "critical"
      : severity === "high"
        ? "high"
        : severity === "medium"
          ? "medium"
          : severity === "low"
            ? "low"
            : "info";
  return (
    <span className={cn(badge({ tone }), className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {severity}
    </span>
  );
}

const STATUS_TONES: Record<string, BadgeTone> = {
  new: "info",
  investigating: "medium",
  escalated: "critical",
  false_positive: "muted",
  closed: "success",
  open: "info",
  containment: "medium",
  eradication: "high",
  resolved: "success",
  in_progress: "medium",
  pending_review: "high",
  active: "success",
  pending: "medium",
  rejected: "critical",
  disabled: "muted",
  healthy: "success",
  degraded: "medium",
  down: "critical",
  up_to_date: "success",
  outdated: "critical",
  ready: "success",
  generating: "medium",
  failed: "critical",
  success: "success",
  failure: "critical",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn(badge({ tone: STATUS_TONES[status] ?? "neutral" }), className)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return <span className={cn(badge({ tone }), "normal-case tracking-normal", className)}>{children}</span>;
}
