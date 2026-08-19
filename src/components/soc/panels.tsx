import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("panel", className)} {...rest}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mono text-[11px] uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
        )}
        <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  delta,
  hint,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "critical" | "high" | "medium" | "success";
  delta?: number;
  hint?: string;
  onClick?: () => void;
}) {
  const toneRing = {
    default: "text-primary bg-primary/10 border-primary/25",
    critical: "text-critical bg-critical/10 border-critical/25",
    high: "text-high bg-high/10 border-high/25",
    medium: "text-medium bg-medium/10 border-medium/25",
    success: "text-success bg-success/10 border-success/25",
  }[tone];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "panel group flex w-full items-start justify-between gap-3 p-4 text-left transition-colors",
        onClick ? "cursor-pointer hover:border-primary/40" : "cursor-default",
      )}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className="mono mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {typeof delta === "number" && (
            <span className={cn("inline-flex items-center gap-0.5", delta >= 0 ? "text-critical" : "text-success")}>
              {delta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {Math.abs(delta)}%
            </span>
          )}
          {hint && <span className="truncate">{hint}</span>}
        </div>
      </div>
      <span className={cn("rounded-md border p-2", toneRing)}>
        <Icon className="size-4" />
      </span>
    </motion.button>
  );
}

export function ChartCard({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Panel className={cn("flex flex-col p-4", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </Panel>
  );
}

export function KeyValue({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={cn("text-sm break-words text-foreground", mono && "mono")}>{value ?? "—"}</span>
    </div>
  );
}
